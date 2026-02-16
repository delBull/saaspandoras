'use client';

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@saasfly/ui/use-toast";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { Switch } from "@saasfly/ui/switch";
import {
    PhotoIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon,
    ServerStackIcon,
    CurrencyDollarIcon,
    RocketLaunchIcon,
    CloudArrowUpIcon,
    ArrowPathIcon,
    QrCodeIcon,
    TicketIcon,
    IdentificationIcon,
    GiftIcon
} from "@heroicons/react/24/outline";
import QRCode from "react-qr-code";
import QRCodeLib from "qrcode";

// Extended ABI for adminMint
const EXTENDED_ABI = [
    ...PANDORAS_KEY_ABI,
    {
        "inputs": [{ "name": "quantity", "type": "uint256" }],
        "name": "mintWithPayment",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

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
    { id: 5, label: 'Enviando Pase de Acceso', icon: ArrowPathIcon },
];

export function CreateNFTPassModal({ isOpen, onClose, onSuccess }: CreateNFTPassModalProps) {
    const { toast } = useToast();
    const account = useActiveAccount();
    const { mutate: sendTransaction } = useSendTransaction();

    const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
    const [deploymentStep, setDeploymentStep] = useState(0);
    const [deployError, setDeployError] = useState<string>('');
    const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isMinting, setIsMinting] = useState(false);

    const [nftType, setNftType] = useState<'access' | 'identity' | 'coupon' | 'qr'>('access');
    const [creationStep, setCreationStep] = useState<0 | 1>(0); // 0: Type Selection, 1: Form Details
    const [generatedShortlink, setGeneratedShortlink] = useState<string | null>(null);

    // Smart QR Landing State
    const [createLanding, setCreateLanding] = useState(false);
    const [landingConfig, setLandingConfig] = useState({
        title: '',
        slogan: '',
        whatsapp: '',
        socials: {
            instagram: '',
            twitter: '',
            facebook: '',
            linkedin: '',
            youtube: '',
            tiktok: '',
            discord: '',
            telegram: ''
        } as Record<string, string>,
        links: [] as { label: string; url: string }[]
    });

    // Helper to update landing config
    const updateLandingConfig = (key: string, value: any) => {
        setLandingConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const updateSocial = (network: string, value: string) => {
        setLandingConfig(prev => ({
            ...prev,
            socials: {
                ...prev.socials,
                [network]: value
            }
        }));
    };

    const addLink = () => {
        setLandingConfig(prev => ({
            ...prev,
            links: [...prev.links, { label: '', url: '' }]
        }));
    };

    const updateLink = (index: number, field: 'label' | 'url', value: string) => {
        setLandingConfig(prev => {
            const newLinks = [...prev.links];
            newLinks[index] = { ...newLinks[index], [field]: value } as { label: string; url: string };
            return { ...prev, links: newLinks };
        });
    };

    const removeLink = (index: number) => {
        setLandingConfig(prev => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index)
        }));
    };

    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        description: "",
        maxSupply: "1000",
        price: "0",
        owner: "",
        imageUrl: "",
        imagePreview: "",
        treasuryAddress: "", // Changed from treasury to treasuryAddress to match API usage
        targetUrl: "",
        transferable: true,
        burnable: false,
        validUntil: null as string | null
    });
    const [airdropToMe, setAirdropToMe] = useState(true);

    const NFT_TYPES = [
        {
            id: 'access',
            title: 'Access Pass',
            description: 'Pase estándar para eventos, contenido o comunidades.',
            icon: TicketIcon,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/30'
        },
        {
            id: 'qr',
            title: 'Smart QR / Action',
            description: 'Conecta el mundo físico. QR dinámico que ejecuta acciones.',
            icon: QrCodeIcon,
            color: 'text-lime-400',
            bg: 'bg-lime-500/10',
            border: 'border-lime-500/30'
        },
        {
            id: 'identity',
            title: 'Digital Identity (SBT)',
            description: 'Credenciales intransferibles (Soulbound) para reputación.',
            icon: IdentificationIcon,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/30'
        },
        {
            id: 'coupon',
            title: 'Gift / Coupon',
            description: 'Activos consumibles o canjeables (Burnable).',
            icon: GiftIcon,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/30'
        }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Update defaults when type changes
    const handleTypeSelect = (typeId: string) => {
        setNftType(typeId as any);
        setCreationStep(1);

        // Set intelligent defaults based on type
        setFormData(prev => ({
            ...prev,
            transferable: typeId !== 'identity', // Identity is non-transferable by default
            burnable: typeId === 'coupon',       // Coupons are burnable by default
            maxSupply: typeId === 'identity' ? '1000000' : '1000' // Identity usually high supply
        }));
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

    const preGeneratedSlugRef = useRef<string | null>(null);

    const handleDeploy = async () => {
        if (!account?.address) {
            toast({ title: "Error", description: "Conecta tu wallet primero", variant: "destructive" });
            return;
        }

        if (!formData.name || !formData.symbol) {
            toast({ title: "Error", description: "Nombre y Símbolo son obligatorios", variant: "destructive" });
            return;
        }

        if (nftType === 'qr' && !formData.targetUrl) {
            toast({ title: "Error", description: "Debes definir una URL de destino para el QR.", variant: "destructive" });
            return;
        }

        setDeploymentStatus('deploying');
        setDeploymentStep(0);

        // Animate through first steps
        const stepInterval = setInterval(() => {
            setDeploymentStep(prev => {
                // If we reach the airdrop step (4), we stop automatic animation and wait for transaction logic
                if (prev < 3) return prev + 1;
                return prev;
            });
        }, 2000);

        try {
            let finalImage = formData.imageUrl || formData.imagePreview || '';

            // Generate QR Code if needed
            if (nftType === 'qr') {
                try {
                    const timestamp = Date.now().toString(36);
                    const random = Math.random().toString(36).substring(2, 7);
                    const slug = `qr-${timestamp}-${random}`;
                    preGeneratedSlugRef.current = slug;

                    const shortlinkUrl = `${window.location.origin}/${slug}`;
                    console.log("Generating QR for:", shortlinkUrl);

                    // Generate Data URI
                    finalImage = await QRCodeLib.toDataURL(shortlinkUrl, {
                        errorCorrectionLevel: 'H',
                        margin: 2,
                        width: 500,
                        color: {
                            dark: '#000000',
                            light: '#ffffff'
                        }
                    });
                } catch (e) {
                    console.error("QR Generation failed", e);
                    throw new Error("No se pudo generar el código QR");
                }
            }

            const payload = {
                name: formData.name,
                symbol: formData.symbol,
                maxSupply: formData.maxSupply,
                price: formData.price,
                description: formData.description,
                owner: account.address,
                treasuryAddress: formData.treasuryAddress || account.address,
                image: finalImage,
                transferable: formData.transferable,
                burnable: formData.burnable,
                validUntil: formData.validUntil,
                nftType: nftType, // Send type to API
                targetUrl: formData.targetUrl || null, // Required for Smart QR
                createLanding: createLanding,
                landingConfig: createLanding ? landingConfig : null
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

            // 4a. If "QR / Action", create the shortlink
            if (nftType === 'qr' && preGeneratedSlugRef.current) {
                try {
                    // Ensure slug is clean (lowercase, alphanumeric, hyphens)
                    const rawSlug = preGeneratedSlugRef.current;
                    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

                    const fullUrl = `${window.location.origin}/${slug}`;

                    // Prepare payload with optional landing config
                    const shortlinkPayload: any = {
                        slug,
                        destinationUrl: formData.targetUrl,
                        title: `QR: ${formData.name}`,
                        description: `Smart QR for NFT ${data.address}`
                    };

                    // Add landing config if enabled
                    if (createLanding) {
                        shortlinkPayload.type = 'landing';
                        shortlinkPayload.landingConfig = {
                            title: landingConfig.title || formData.name,
                            slogan: landingConfig.slogan || '',
                            logoUrl: formData.imageUrl || '',
                            links: landingConfig.links.filter(link => link.url && link.label),
                            socials: Object.entries(landingConfig.socials)
                                .filter(([_, url]) => url)
                                .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
                            whatsapp: landingConfig.whatsapp || '',
                        };
                    } else {
                        shortlinkPayload.type = 'redirect';
                    }

                    const shortlinkRes = await fetch('/api/admin/shortlinks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(shortlinkPayload)
                    });

                    if (!shortlinkRes.ok) {
                        const errData = await shortlinkRes.json();
                        console.error("Shortlink creation error:", errData);
                        throw new Error(errData.error || "Fallo creación de enlace");
                    }

                    setGeneratedShortlink(fullUrl);
                } catch (e) {
                    console.error("Failed to create shortlink", e);
                    toast({
                        title: "⚠️ Advertencia",
                        description: "El contrato se creó pero falló la generación del Shortlink. Intenta crearlo manualmente en Dashboard.",
                        variant: "destructive"
                    });
                }
            }

            // 4b. If airdrop is selected, perform the minting transaction
            if (airdropToMe) {
                setDeploymentStep(4); // "Enviando Pase de Acceso"
                setIsMinting(true);

                const contract = getContract({
                    client,
                    chain: config.chain,
                    address: data.address,
                    abi: EXTENDED_ABI,
                });

                const transaction = prepareContractCall({
                    contract,
                    method: "mintWithPayment",
                    params: [1n], // Mint 1 pass
                    value: 0n // Price is assumed 0 for admin setup
                });

                await new Promise((resolve, reject) => {
                    sendTransaction(transaction, {
                        onSuccess: () => resolve(true),
                        onError: (e) => reject(e)
                    });
                });
            }

            setDeploymentStatus('success');

        } catch (err: unknown) {
            clearInterval(stepInterval);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setDeployError(errorMessage);
            setDeploymentStatus('error');
        } finally {
            setIsMinting(false);
        }
    };

    const handleSuccessClose = () => {
        if (onSuccess) onSuccess();
        onClose();
    };

    const reset = () => {
        setCreationStep(0);
        setNftType('access');
        setGeneratedShortlink(null);
        setDeploymentStatus('idle');
        setFormData({
            name: "",
            symbol: "",
            description: "",
            maxSupply: "1000",
            price: "0",
            owner: "",
            imageUrl: "",
            imagePreview: "",
            treasuryAddress: "",
            targetUrl: "",
            transferable: true,
            burnable: false,
            validUntil: null
        });
        // Removed page reload
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
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-lime-500/20 rounded-full blur-3xl"></div>

                        <div className="p-8 relative z-10">
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

                            {deploymentStatus === 'success' && (
                                <div className="text-center py-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-emerald-500 to-lime-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
                                    >
                                        <CheckCircleIcon className="w-10 h-10 text-black/80" />
                                    </motion.div>
                                    <h2 className="text-3xl font-bold text-white mb-2">¡NFT Creado!</h2>
                                    <p className="text-gray-400 mb-4">
                                        El contrato <span className="text-white font-bold">{formData.name}</span> ha sido desplegado.
                                    </p>

                                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 mb-6 break-all font-mono text-xs text-zinc-400">
                                        {deployedAddress}
                                    </div>

                                    {/* QR Code Display */}
                                    {generatedShortlink && (
                                        <div className="mb-6 bg-white p-4 rounded-xl inline-block">
                                            <QRCode value={generatedShortlink} size={150} />
                                            <p className="text-black text-xs font-bold mt-2 text-center break-all max-w-[150px]">
                                                {generatedShortlink.replace('https://', '')}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSuccessClose}
                                        className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                                    >
                                        Continuar
                                    </button>
                                </div>
                            )}

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

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {creationStep === 0 ? "Selecciona Tipo de NFT" : (nftType === 'qr' ? "🚀 Crear Smart QR" : "🎫 Crear Access Pass")}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {creationStep === 0 ? "Define el propósito de tu nuevo contrato inteligente" : "Configura los detalles del despliegue"}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8">

                    {/* STEP 0: TYPE SELECTION */}
                    {creationStep === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {NFT_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => handleTypeSelect(type.id)}
                                        className={`group relative p-6 rounded-xl border border-zinc-700 hover:border-lime-500/50 bg-zinc-800/20 hover:bg-zinc-800/50 transition-all text-left flex flex-col gap-4`}
                                    >
                                        <div className={`w-12 h-12 rounded-lg ${type.bg} ${type.border} border flex items-center justify-center`}>
                                            <Icon className={`w-6 h-6 ${type.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-lime-400 transition-colors">{type.title}</h3>
                                            <p className="text-sm text-zinc-400 mt-1">{type.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* STEP 1: FORM DETAILS */}
                    {creationStep === 1 && (
                        <>
                            {/* Section 1: Identity */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">1</span>
                                    Identidad del Contrato
                                </h3>

                                <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="nft-pass-name" className="block text-xs font-medium text-gray-400 mb-1">Nombre</label>
                                            <input
                                                id="nft-pass-name"
                                                name="name"
                                                type="text"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Ej. VIP Access o Promo QR"
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
                                                placeholder="Ej. VIP, QR01"
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="nft-pass-description" className="block text-xs font-medium text-gray-400 mb-1">Descripción</label>
                                        <input
                                            id="nft-pass-description"
                                            name="description"
                                            type="text"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Propósito del contrato..."
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>

                                    {/* QR Target URL Input */}
                                    {nftType === 'qr' && (
                                        <div className="pt-4 border-t border-zinc-700/50 mt-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="flex items-center gap-2 text-sm font-medium text-lime-400 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={createLanding}
                                                        onChange={(e) => setCreateLanding(e.target.checked)}
                                                        className="w-4 h-4 rounded border-gray-600 text-lime-500 focus:ring-lime-500 bg-zinc-800"
                                                    />
                                                    <span>¿Crear Landing Page?</span>
                                                </label>
                                            </div>

                                            {!createLanding ? (
                                                <div className="animate-in fade-in slide-in-from-top-2">
                                                    <label htmlFor="nft-target-url" className="text-xs font-medium text-lime-400 mb-1 flex items-center gap-2">
                                                        <QrCodeIcon className="w-4 h-4" />
                                                        Target URL (Destino del QR)
                                                    </label>
                                                    <input
                                                        id="nft-target-url"
                                                        name="targetUrl"
                                                        type="url"
                                                        value={formData.targetUrl}
                                                        onChange={handleChange}
                                                        placeholder="https://tudominio.com/landing-page"
                                                        className="w-full bg-zinc-900 border border-lime-500/50 rounded px-3 py-2 text-white focus:border-lime-500 outline-none"
                                                    />
                                                    <p className="text-xs text-zinc-500 mt-1">Este será el destino al escanear el QR.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-zinc-800/30 p-4 rounded-xl border border-zinc-700">
                                                    <h4 className="font-bold text-sm text-white mb-2">Configuración de Landing Page</h4>

                                                    {/* Init with Name/Desc */}
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div>
                                                            <label htmlFor="landing-title" className="text-xs text-gray-400">Título</label>
                                                            <input
                                                                id="landing-title"
                                                                type="text"
                                                                value={landingConfig.title}
                                                                onChange={(e) => updateLandingConfig('title', e.target.value)}
                                                                placeholder={formData.name || "Título de la Landing"}
                                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-lime-500 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor="landing-slogan" className="text-xs text-gray-400">Eslogan / Subtítulo</label>
                                                            <input
                                                                id="landing-slogan"
                                                                type="text"
                                                                value={landingConfig.slogan}
                                                                onChange={(e) => updateLandingConfig('slogan', e.target.value)}
                                                                placeholder="Tu frase impactante aquí"
                                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-lime-500 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor="landing-whatsapp" className="text-xs text-gray-400 flex items-center gap-1">
                                                                <QrCodeIcon className="w-3 h-3" /> WhatsApp (Obligatorio para CTA principal)
                                                            </label>
                                                            <input
                                                                id="landing-whatsapp"
                                                                type="text"
                                                                value={landingConfig.whatsapp}
                                                                onChange={(e) => updateLandingConfig('whatsapp', e.target.value)}
                                                                placeholder="521..."
                                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-lime-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Redes Sociales */}
                                                    <div>
                                                        <h5 className="text-xs font-bold text-gray-300 mb-2 mt-2">Redes Sociales</h5>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {Object.keys(landingConfig.socials).map((network) => (
                                                                <input
                                                                    key={network}
                                                                    type="text"
                                                                    value={landingConfig.socials[network]}
                                                                    onChange={(e) => updateSocial(network, e.target.value)}
                                                                    placeholder={network.charAt(0).toUpperCase() + network.slice(1)}
                                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:border-lime-500 outline-none"
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Links Extras */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2 mt-2">
                                                            <h5 className="text-xs font-bold text-gray-300">Enlaces Adicionales</h5>
                                                            <button
                                                                type="button"
                                                                onClick={addLink}
                                                                className="text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-white"
                                                            >
                                                                + Agregar Link
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {landingConfig.links.map((link, index) => (
                                                                <div key={index} className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Label"
                                                                        value={link.label}
                                                                        onChange={(e) => updateLink(index, 'label', e.target.value)}
                                                                        className="w-1/3 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="URL"
                                                                        value={link.url}
                                                                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                                                                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeLink(index)}
                                                                        className="text-red-400 hover:text-red-300 px-1"
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 2: Economics */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm">2</span>
                                    Reglas y Economía
                                </h3>

                                <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group relative">
                                            <div className="flex justify-between items-center mb-1">
                                                <label htmlFor="nft-pass-maxSupply" className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                                    Max Supply <InformationCircleIcon className="w-3 h-3" />
                                                </label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="checkbox"
                                                        id="unlimited-supply"
                                                        className="w-3 h-3 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/50"
                                                        checked={formData.maxSupply === '115792089237316195423570985008687907853269984665640564039457584007913129639935'} // MAX_UINT256
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData(prev => ({ ...prev, maxSupply: '115792089237316195423570985008687907853269984665640564039457584007913129639935' }));
                                                            } else {
                                                                setFormData(prev => ({ ...prev, maxSupply: '1000' }));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor="unlimited-supply" className="text-[10px] text-zinc-500 cursor-pointer uppercase font-bold">Ilimitado</label>
                                                </div>
                                            </div>
                                            <input
                                                id="nft-pass-maxSupply"
                                                name="maxSupply"
                                                type="text" // Changed to text to handle large numbers visually or disable
                                                disabled={formData.maxSupply === '115792089237316195423570985008687907853269984665640564039457584007913129639935'}
                                                value={formData.maxSupply === '115792089237316195423570985008687907853269984665640564039457584007913129639935' ? '∞' : formData.maxSupply}
                                                onChange={handleChange}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                                            />
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
                                            name="treasuryAddress"
                                            type="text"
                                            value={formData.treasuryAddress}
                                            onChange={handleChange}
                                            placeholder="0x..."
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    {/* Advanced Traits Toggles */}
                                    <div className="pt-2 border-t border-zinc-700/50 mt-2 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label htmlFor="switch-transferable" className="text-sm font-medium text-gray-300 block">Transferible</label>
                                                <p className="text-xs text-zinc-500">¿Se puede enviar a otros usuarios?</p>
                                            </div>
                                            <Switch
                                                id="switch-transferable"
                                                checked={formData.transferable}
                                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, transferable: checked }))}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label htmlFor="switch-burnable" className="text-sm font-medium text-gray-300 block">Burnable (Quemable)</label>
                                                <p className="text-xs text-zinc-500">¿Se puede destruir para canjear?</p>
                                            </div>
                                            <Switch
                                                id="switch-burnable"
                                                checked={formData.burnable}
                                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, burnable: checked }))}
                                                className="data-[state=checked]:bg-rose-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2 border-t border-zinc-700/50 mt-2">
                                        <input
                                            id="airdrop-me"
                                            type="checkbox"
                                            checked={airdropToMe}
                                            onChange={(e) => setAirdropToMe(e.target.checked)}
                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/50"
                                        />
                                        <label htmlFor="airdrop-me" className="text-sm text-gray-300 cursor-pointer">
                                            Mintar el primer token a mi wallet (Admin)
                                        </label>
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
                                            <h4 className="font-bold text-white">Visual del Token</h4>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Imagen que representa este {nftType.toUpperCase()}.
                                            </p>
                                        </div>

                                        {formData.imageUrl && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                                                <p className="text-emerald-400 text-xs flex items-center gap-1">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    Imagen lista
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900 z-10 sticky bottom-0 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors">
                        Cancelar
                    </button>
                    {creationStep === 1 && (
                        <button onClick={() => setCreationStep(0)} className="px-4 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 border border-zinc-700">
                            Atrás
                        </button>
                    )}
                    {creationStep === 1 ? (
                        <button
                            onClick={handleDeploy}
                            disabled={!formData.name || !formData.symbol || (nftType === 'qr' && !createLanding && !formData.targetUrl)}
                            className={`px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transform transition-all 
                                    ${!formData.name || !formData.symbol || (nftType === 'qr' && !createLanding && !formData.targetUrl)
                                    ? 'bg-zinc-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black shadow-lime-500/20 hover:scale-[1.02]'
                                }`}
                        >
                            🚀 Desplegar {nftType === 'qr' ? 'QR & Contract' : 'Contrato'}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
