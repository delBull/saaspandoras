'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@saasfly/ui/use-toast";
import { useActiveAccount } from "thirdweb/react";
import {
    PhotoIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon,
    ServerStackIcon,
    CurrencyDollarIcon,
    RocketLaunchIcon,
    CloudArrowUpIcon
} from "@heroicons/react/24/outline";

interface CreateNFTPassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void; // Callback after successful deployment
}

const DEPLOYMENT_STEPS = [
    { id: 1, label: 'Validando Configuración', icon: ShieldCheckIcon },
    { id: 2, label: 'Desplegando Contrato NFT', icon: ServerStackIcon },
    { id: 3, label: 'Configurando Access Control', icon: CurrencyDollarIcon },
    { id: 4, label: 'Registrando en Sistema', icon: RocketLaunchIcon },
];

export function CreateNFTPassModal({ isOpen, onClose, onSuccess }: CreateNFTPassModalProps) {
    const { toast } = useToast();
    const account = useActiveAccount();

    const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
    const [deploymentStep, setDeploymentStep] = useState(0);
    const [deployError, setDeployError] = useState<string>('');
    const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        description: "",
        maxSupply: "1000",
        price: "0",
        imageUrl: "",
        imagePreview: "",
        treasury: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Image Upload Handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
            toast({ title: "Error", description: "Solo se permiten imágenes (PNG, JPG, GIF, WEBP)", variant: "destructive" });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "Error", description: "La imagen debe ser menor a 5MB", variant: "destructive" });
            return;
        }

        // Preview with FileReader
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imagePreview: reader.result as string }));
        };
        reader.readAsDataURL(file);

        // Upload to server
        setUploadingImage(true);
        try {
            const uploadForm = new FormData();
            uploadForm.append("file", file);

            const res = await fetch("/api/admin/upload-asset", {
                method: "POST",
                body: uploadForm
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Error al subir imagen");

            setFormData(prev => ({ ...prev, imageUrl: data.url }));
            toast({ title: "¡Imagen Subida!", description: "La imagen se ha cargado exitosamente" });

        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: String(err), variant: "destructive" });
            setFormData(prev => ({ ...prev, imagePreview: "" }));
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDeploy = async () => {
        if (!account?.address) {
            toast({ title: "Error", description: "Conecta tu wallet primero", variant: "destructive" });
            return;
        }

        if (!formData.name || !formData.symbol) {
            toast({ title: "Error", description: "Nombre y Símbolo son obligatorios", variant: "destructive" });
            return;
        }

        setDeploymentStatus('deploying');
        setDeploymentStep(0);

        // Animate through steps
        const stepInterval = setInterval(() => {
            setDeploymentStep(prev => {
                if (prev < DEPLOYMENT_STEPS.length - 1) return prev + 1;
                clearInterval(stepInterval);
                return prev;
            });
        }, 1500);

        try {
            const payload = {
                name: formData.name,
                symbol: formData.symbol,
                maxSupply: formData.maxSupply,
                price: formData.price,
                owner: account.address,
                treasuryAddress: formData.treasury || account.address,
                image: formData.imageUrl || formData.imagePreview || ''
            };

            const res = await fetch("/api/admin/deploy/nft-pass", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                clearInterval(stepInterval);
                throw new Error(data.error || "Error en despliegue");
            }

            clearInterval(stepInterval);
            setDeployedAddress(data.address);
            setDeploymentStatus('success');

        } catch (err: unknown) {
            clearInterval(stepInterval);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setDeployError(errorMessage);
            setDeploymentStatus('error');
        }
    };

    const reset = () => {
        setDeploymentStatus('idle');
        setDeploymentStep(0);
        setDeployedAddress(null);
        setDeployError('');
        setFormData({
            name: "",
            symbol: "",
            description: "",
            maxSupply: "1000",
            price: "0",
            imageUrl: "",
            imagePreview: "",
            treasury: ""
        });
        onSuccess?.(); // Trigger refresh callback
        onClose();
    };

    if (!isOpen) return null;

    // Show Deployment Progress Modal
    if (deploymentStatus !== 'idle') {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                    >
                        {/* Background decorations */}
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-lime-500/20 rounded-full blur-3xl"></div>

                        <div className="p-8 relative z-10">
                            {/* DEPLOYING */}
                            {deploymentStatus === 'deploying' && (
                                <div className="text-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-zinc-800 border-t-emerald-500"
                                    />
                                    <h2 className="text-2xl font-bold text-white mb-2">Desplegando NFT Pass</h2>
                                    <p className="text-gray-400 mb-8 max-w-[250px] mx-auto">
                                        Creando contrato de acceso <span className="text-emerald-400 font-semibold">{formData.name}</span>...
                                    </p>

                                    <div className="space-y-4 text-left">
                                        {DEPLOYMENT_STEPS.map((step, index) => {
                                            const Icon = step.icon;
                                            const isCompleted = deploymentStep > index;
                                            const isCurrent = deploymentStep === index;

                                            return (
                                                <div key={step.id} className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                                                        ${isCompleted ? 'bg-emerald-500 text-black' : isCurrent ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-900 text-zinc-700'}
                                                    `}>
                                                        {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium transition-colors duration-300 ${isCurrent || isCompleted ? 'text-white' : 'text-zinc-600'}`}>
                                                            {step.label}
                                                        </p>
                                                        {isCurrent && (
                                                            <motion.div
                                                                layoutId="active-step-bar"
                                                                className="h-1 bg-emerald-500/50 rounded-full mt-1 w-full overflow-hidden"
                                                            >
                                                                <motion.div
                                                                    initial={{ x: '-100%' }}
                                                                    animate={{ x: '100%' }}
                                                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                                    className="h-full w-1/2 bg-emerald-400"
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* SUCCESS */}
                            {deploymentStatus === 'success' && (
                                <div className="text-center py-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-emerald-500 to-lime-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
                                    >
                                        <CheckCircleIcon className="w-10 h-10 text-black/80" />
                                    </motion.div>
                                    <h2 className="text-3xl font-bold text-white mb-2">¡NFT Pass Creado!</h2>
                                    <p className="text-gray-400 mb-4">
                                        El pase <span className="text-white font-bold">{formData.name}</span> ha sido desplegado.
                                    </p>

                                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 mb-6 break-all font-mono text-xs text-zinc-400">
                                        {deployedAddress}
                                    </div>

                                    <button
                                        onClick={reset}
                                        className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                                    >
                                        Continuar al Dashboard
                                    </button>
                                </div>
                            )}

                            {/* ERROR */}
                            {deploymentStatus === 'error' && (
                                <div className="text-center py-4">
                                    <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                                        <XCircleIcon className="w-10 h-10 text-red-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Error en Despliegue</h2>
                                    <p className="text-red-300/80 mb-6 text-sm bg-red-950/30 p-3 rounded-lg border border-red-900/50 border-dashed">
                                        {deployError || 'Ocurrió un error desconocido'}
                                    </p>

                                    <button
                                        onClick={() => setDeploymentStatus('idle')}
                                        className="w-full py-3 px-4 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700"
                                    >
                                        Cerrar e Intentar de Nuevo
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    // Main Configuration Modal
    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🎫 Crear NFT Access Pass
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Configura y despliega un nuevo contrato de acceso SCaaS</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    {/* Section 1: Identity */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">1</span>
                            Identidad del Pase
                        </h3>

                        <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="nft-pass-name" className="block text-xs font-medium text-gray-400 mb-1">Nombre del Pase</label>
                                    <input
                                        id="nft-pass-name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ej. Premium Access Card"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="nft-pass-symbol" className="block text-xs font-medium text-gray-400 mb-1">Símbolo</label>
                                    <input
                                        id="nft-pass-symbol"
                                        name="symbol"
                                        type="text"
                                        value={formData.symbol}
                                        onChange={handleChange}
                                        placeholder="Ej. PAC"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="nft-pass-description" className="block text-xs font-medium text-gray-400 mb-1">Descripción (Interno)</label>
                                <input
                                    id="nft-pass-description"
                                    name="description"
                                    type="text"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Propósito del pase..."
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Economics */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm">2</span>
                            Economía del Pase
                        </h3>

                        <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group relative">
                                    <label htmlFor="nft-pass-maxSupply" className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                        Max Supply <InformationCircleIcon className="w-3 h-3" />
                                    </label>
                                    <input
                                        id="nft-pass-maxSupply"
                                        name="maxSupply"
                                        type="number"
                                        value={formData.maxSupply}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                    />
                                    <div className="absolute hidden group-hover:block z-20 bottom-full left-0 w-48 p-2 bg-black border border-zinc-700 text-xs text-gray-300 rounded mb-1">
                                        Máximo de pases. 0 = ilimitado.
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="nft-pass-price" className="block text-xs font-medium text-gray-400 mb-1">Precio (ETH)</label>
                                    <input
                                        id="nft-pass-price"
                                        name="price"
                                        type="number"
                                        step="0.001"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="nft-pass-treasury" className="block text-xs font-medium text-gray-400 mb-1">Wallet Tesorería (Opcional)</label>
                                <input
                                    id="nft-pass-treasury"
                                    name="treasury"
                                    type="text"
                                    value={formData.treasury}
                                    onChange={handleChange}
                                    placeholder="0x..."
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                />
                                <p className="text-xs text-zinc-500 mt-1">Si se deja vacío, tú recibirás los pagos.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: NFT Image */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-amber-300 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-sm">3</span>
                            Imagen del NFT
                        </h3>

                        <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 flex flex-col md:flex-row gap-6 items-start">
                            <div className="relative group w-full md:w-48 aspect-square bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-600 hover:border-amber-500/50 transition-colors flex flex-col items-center justify-center overflow-hidden">
                                {formData.imagePreview ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={formData.imagePreview} alt="NFT Preview" className="w-full h-full object-cover" />
                                        {uploadingImage && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <CloudArrowUpIcon className="w-8 h-8 text-white animate-bounce" />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <PhotoIcon className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                                        <p className="text-sm text-gray-400">Subir Imagen</p>
                                        <p className="text-xs text-gray-600 mt-1">PNG, JPG, GIF</p>
                                        <p className="text-xs text-gray-600">Max 5MB</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                            </div>

                            <div className="flex-1 space-y-3">
                                <div>
                                    <h4 className="font-bold text-white">Access Card NFT</h4>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Imagen que verán los usuarios al adquirir este pase de acceso.
                                    </p>
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                                    <p className="text-amber-200 text-xs font-medium mb-1">💡 Tip</p>
                                    <p className="text-amber-100/70 text-xs">
                                        Recomendado: 600x600px o superior. Formatos PNG con transparencia funcionan mejor.
                                    </p>
                                </div>

                                {formData.imageUrl && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                                        <p className="text-emerald-400 text-xs flex items-center gap-1">
                                            <CheckCircleIcon className="w-4 h-4" />
                                            Imagen subida exitosamente
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900 z-10 sticky bottom-0 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleDeploy}
                        disabled={!formData.name || !formData.symbol}
                        className={`px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transform transition-all 
                            ${!formData.name || !formData.symbol
                                ? 'bg-zinc-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black shadow-lime-500/20 hover:scale-[1.02]'
                            }`}
                    >
                        🚀 Desplegar NFT Pass
                    </button>
                </div>
            </div>
        </div>
    );
}
