
"use client";

import {
    VoteIcon,
    WalletIcon,
    TrendingUpIcon,
    SettingsIcon,
    ShieldCheckIcon,
    BookOpenIcon,
    UsersIcon,
    ActivityIcon,
    ArrowUpRightIcon,
    AlertCircleIcon
} from "lucide-react";

export function DAODocs() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BookOpenIcon className="w-8 h-8 text-lime-400" />
                    Guía del DAO & Documentación
                </h2>
                <p className="text-zinc-400 mt-2 text-lg">
                    Entiende cómo opera tu Organización Autónoma Descentralizada, tus derechos como miembro y cómo participar en la gobernanza.
                </p>
            </div>

            {/* 1. ¿Qué es este DAO? */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-lime-500/10 rounded-xl">
                        <ShieldCheckIcon className="w-6 h-6 text-lime-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-3">1. Seguridad y Autonomía</h3>
                        <p className="text-zinc-300 leading-relaxed mb-4">
                            Este protocolo opera sobre la blockchain (Base / Ethereum), lo que significa que las reglas son transparentes e inmutables.
                            A diferencia de una empresa tradicional, <strong>nadie tiene control absoluto</strong> sobre la tesorería o las decisiones críticas sin el consenso de la comunidad.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/30 p-4 rounded-lg text-sm text-zinc-400 border border-zinc-800">
                                <strong className="text-white block mb-1">Tesorería Protegida</strong>
                                Los fondos viven en un contrato inteligente. Para moverlos, se requiere una propuesta aprobada por votación.
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg text-sm text-zinc-400 border border-zinc-800">
                                <strong className="text-white block mb-1">Sin Intermediarios</strong>
                                Las recompensas y pagos se ejecutan automáticamente cuando se cumplen las condiciones programadas.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Poder de Voto */}
            <section className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <VoteIcon className="w-6 h-6 text-purple-400" />
                    2. Tu Poder de Gobernanza
                </h3>
                <p className="text-zinc-400">
                    Tu influencia en el DAO no es fija; crece a medida que te involucras más en el protocolo.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-zinc-900/80 p-5 rounded-xl border border-zinc-800">
                        <h4 className="font-bold text-white mb-2">Access Cards (NFT)</h4>
                        <p className="text-sm text-zinc-400">
                            Tu "pasaporte" al DAO. Otorga membresía base y permite crear propuestas.
                        </p>
                    </div>
                    <div className="bg-zinc-900/80 p-5 rounded-xl border border-zinc-800">
                        <h4 className="font-bold text-white mb-2">Tokens de Gobernanza ($PBOX)</h4>
                        <p className="text-sm text-zinc-400">
                            Determinan el peso de tu voto. 1 Token = 1 Voto. Puedes delegarlos si no quieres votar activamente.
                        </p>
                    </div>
                    <div className="bg-zinc-900/80 p-5 rounded-xl border border-zinc-800">
                        <h4 className="font-bold text-white mb-2">Reputación</h4>
                        <p className="text-sm text-zinc-400">
                            Ganada completando misiones. Puede desbloquear roles especiales o multiplicadores de voto.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. Ciclo de Propuestas */}
            <section className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <ActivityIcon className="w-6 h-6 text-blue-400" />
                    3. Cómo funciona una Propuesta
                </h3>

                <div className="relative border-l-2 border-zinc-800 ml-3 space-y-8 pl-8 py-2">
                    <div className="relative">
                        <div className="absolute -left-[41px] bg-blue-500/20 w-6 h-6 rounded-full border border-blue-500 flex items-center justify-center text-[10px] text-blue-400 font-bold">1</div>
                        <h4 className="font-bold text-white text-lg">Creación</h4>
                        <p className="text-sm text-zinc-400 mt-1">
                            Cualquier miembro con suficiente poder de voto puede crear una propuesta (ej. "Transferir 500 USDC a Marketing").
                            Esto ocurre On-Chain y tiene un costo de gas.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-[41px] bg-blue-500/20 w-6 h-6 rounded-full border border-blue-500 flex items-center justify-center text-[10px] text-blue-400 font-bold">2</div>
                        <h4 className="font-bold text-white text-lg">Periodo de Votación</h4>
                        <p className="text-sm text-zinc-400 mt-1">
                            La propuesta está activa (usualmente 3-7 días). Los miembros votan: <strong>A favor</strong>, <strong>En contra</strong> o <strong>Abstención</strong>.
                            El poder de voto se calcula al momento exacto que inició la propuesta (Snapshot).
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-[41px] bg-blue-500/20 w-6 h-6 rounded-full border border-blue-500 flex items-center justify-center text-[10px] text-blue-400 font-bold">3</div>
                        <h4 className="font-bold text-white text-lg">Ejecución & Timelock</h4>
                        <p className="text-sm text-zinc-400 mt-1">
                            Si gana "A favor" y se alcanza el Quorum, la propuesta entra en "Cola" (Timelock) por 2 días.
                            Esto es un periodo de seguridad. Pasado el tiempo, cualquiera puede ejecutar la transacción.
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. Finanzas y Recompensas */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <WalletIcon className="w-8 h-8 text-green-400 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Tesorería (Treasury)</h3>
                    <p className="text-sm text-zinc-400 mb-4">
                        Es la cuenta bancaria del DAO. Acumula ingresos por ventas de Access Cards, fees de protocolo y donaciones.
                    </p>
                    <ul className="text-sm text-zinc-500 list-disc list-inside space-y-1">
                        <li>Visible públicamente en la blockchain.</li>
                        <li>Solo movible por propuestas exitosas.</li>
                        <li>Soporta ETH, USDC y otros tokens ERC20.</li>
                    </ul>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <TrendingUpIcon className="w-8 h-8 text-yellow-400 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Recompensas (Work-to-Earn)</h3>
                    <p className="text-sm text-zinc-400 mb-4">
                        Ganar dinero aportando valor. Las misiones son tareas verificables (sociales, desarrollo, marketing).
                    </p>
                    <ul className="text-sm text-zinc-500 list-disc list-inside space-y-1">
                        <li>Pagos directos a tu wallet.</li>
                        <li>Verificación manual (Admin) o automática (API).</li>
                        <li>Puede pagarse en Stablecoin o Token Nativo.</li>
                    </ul>
                </div>
            </section>

            {/* 5. FAQ / Roles */}
            <section className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <UsersIcon className="w-6 h-6 text-orange-400" />
                    Roles y Responsabilidades
                </h3>
                <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl bg-zinc-900/50">
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-white">Administrador / Creador</h4>
                            <span className="text-xs bg-lime-500/10 text-lime-400 px-2 py-1 rounded">Alto Nivel</span>
                        </div>
                        <p className="text-sm text-zinc-400">
                            Propone la visión inicial, configura las misiones y valida el trabajo realizado. Tiene poder de veto limitado en etapas tempranas.
                        </p>
                    </div>
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-white">Delegado</h4>
                            <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded">Gobernanza</span>
                        </div>
                        <p className="text-sm text-zinc-400">
                            Miembro activo al que otros le han confiado sus votos. Es responsable de estudiar las propuestas y votar en nombre de la comunidad.
                        </p>
                    </div>
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-white">Trabajador (Contributor)</h4>
                            <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">Operativo</span>
                        </div>
                        <p className="text-sm text-zinc-400">
                            Ejecuta misiones y tareas para recibir recompensas. No requiere tener gran poder de voto, solo habilidades para completar el trabajo.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
