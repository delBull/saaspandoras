"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    ClockIcon,
    RocketLaunchIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function ApplyPage() {
    const [formData, setFormData] = useState({
        name: "",
        contact: "", // Email or WhatsApp
        concept: "",
        capital: "",
        time: ""
    });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");

        try {
            const res = await fetch("/api/whitepaper/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStatus("success");
            } else {
                setStatus("error");
            }
        } catch (error) {
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-zinc-900 border border-lime-500/50 p-8 rounded-2xl max-w-md text-center"
                >
                    <CheckCircleIcon className="w-16 h-16 text-lime-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">¡Solicitud Enviada!</h2>
                    <p className="text-gray-400 mb-6">
                        Hemos recibido tu aplicación. Nuestro equipo de Growth revisará tu perfil y te contactará si cumples con los requisitos para iniciar tu protocolo con Pandoras.
                    </p>
                    <Link href="/whitepaper" className="text-lime-400 hover:underline">
                        Volver al Whitepaper
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-lime-500/30">
            {/* Header */}
            <div className="absolute top-6 left-6 z-20">
                <Link href="/whitepaper" className="flex items-center text-gray-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Volver
                </Link>
            </div>

            <div className="max-w-4xl mx-auto py-20 px-4">
                {/* Intro Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-lime-300 to-emerald-500">
                        Inicia tu Protocolo
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Pandoras no es para todos. Buscamos fundadores con capacidad de ejecución y capital operativo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Requirements Column */}
                    <div className="space-y-8">
                        <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center text-white">
                                <ExclamationTriangleIcon className="w-6 h-6 text-amber-500 mr-2" />
                                Realidad del Ecosistema
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Lanzar un protocolo o una DAO no es un juego. Requiere compromiso, visión y recursos.
                                <strong> No necesitas tener el producto construido</strong>, pero sí la determinación y los medios para financiar su desarrollo y operación inicial.
                            </p>
                        </section>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <CurrencyDollarIcon className="w-6 h-6 text-lime-500 mt-1 mr-3 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-white">Capital Inicial Requerido</h4>
                                    <p className="text-sm text-gray-400">
                                        Debes contar con capital para cubrir costos legales, operativos y de marketing inicial.
                                        Pandoras acelera la tecnología, pero el negocio lo construyes tú.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <ClockIcon className="w-6 h-6 text-lime-500 mt-1 mr-3 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-white">Tiempo & Capacidad</h4>
                                    <p className="text-sm text-gray-400">
                                        Esto no es un "side hustle". Buscamos fundadores dedicados o equipos con capacidad de ejecución probada.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <RocketLaunchIcon className="w-6 h-6 text-lime-500 mt-1 mr-3 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-white">Visión de Escala</h4>
                                    <p className="text-sm text-gray-400">
                                        Tu idea debe tener el potencial de beneficiarse de la descentralización y la tokenización.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Column */}
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6 text-white">Aplicación Fast-Track</h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-lime-500 focus:outline-none transition-colors"
                                    placeholder="Juan Pérez"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Contacto (WhatsApp / Email)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-lime-500 focus:outline-none transition-colors"
                                    placeholder="+52 55..."
                                    value={formData.contact}
                                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Concepto / Idea (Breve)</label>
                                <textarea
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-lime-500 focus:outline-none transition-colors h-24"
                                    placeholder="Real Estate DAO, Agencia de Marketing Web3..."
                                    value={formData.concept}
                                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Capital Disponible</label>
                                    <select
                                        required
                                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-lime-500 focus:outline-none transition-colors"
                                        value={formData.capital}
                                        onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
                                    >
                                        <option value="">Selecciona...</option>
                                        <option value="bootstrapped">Propio (Bootstrapped)</option>
                                        <option value="seed">Seed Capital (Investors)</option>
                                        <option value="none">Sin Capital (Solo Idea)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Disponibilidad</label>
                                    <select
                                        required
                                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-lime-500 focus:outline-none transition-colors"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    >
                                        <option value="">Selecciona...</option>
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Parcial / Side Project</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="w-full bg-gradient-to-r from-lime-500 to-emerald-600 text-black font-bold py-4 rounded-lg hover:from-lime-400 hover:to-emerald-500 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === 'submitting' ? 'Enviando...' : 'Enviar Aplicación'}
                            </button>

                            {status === 'error' && (
                                <p className="text-red-500 text-sm text-center">Hubo un error al enviar. Por favor intenta de nuevo.</p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
