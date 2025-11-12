"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Wallet,
  Building2,
  Users,
  Shield,
  TrendingUp,
  Smartphone,
  Globe,
  Zap,
  Lock,
  Heart
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface EcosystemNode {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  position: { x: number; y: number };
  connections: string[];
}

export function PlatformEcosystem() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const ecosystemNodes: EcosystemNode[] = [
    {
      id: "users",
      title: "Usuarios",
      description: "Inversores globales",
      icon: <Users className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      position: { x: 50, y: 20 },
      connections: ["wallet", "projects"]
    },
    {
      id: "wallet",
      title: "Wallets",
      description: "Conexión segura",
      icon: <Wallet className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      position: { x: 20, y: 50 },
      connections: ["users", "security"]
    },
    {
      id: "projects",
      title: "Protocolos",
      description: "Activos tokenizados",
      icon: <Building2 className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      position: { x: 80, y: 50 },
      connections: ["users", "analytics"]
    },
    {
      id: "security",
      title: "Seguridad",
      description: "Blockchain + Auditorías",
      icon: <Shield className="w-6 h-6" />,
      color: "from-orange-500 to-red-500",
      position: { x: 10, y: 80 },
      connections: ["wallet", "compliance"]
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Datos en tiempo real",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-indigo-500 to-purple-500",
      position: { x: 90, y: 80 },
      connections: ["projects", "mobile"]
    },
    {
      id: "mobile",
      title: "App Móvil",
      description: "Acceso everywhere",
      icon: <Smartphone className="w-6 h-6" />,
      color: "from-teal-500 to-blue-500",
      position: { x: 50, y: 90 },
      connections: ["analytics"]
    }
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="mb-20"
    >
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Ecosistema
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {" "}Conectado
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-zinc-400 max-w-3xl mx-auto"
        >
          Todos los componentes trabajando en perfecta armonía para tu éxito financiero
        </motion.p>
      </div>

      {/* Visual Network */}
      <div className="relative max-w-4xl mx-auto mb-16">
        <div className="relative h-96 bg-zinc-900/20 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
          {ecosystemNodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? {
                opacity: 1,
                scale: 1,
                left: `${node.position.x}%`,
                top: `${node.position.y}%`
              } : {
                opacity: 0,
                scale: 0
              }}
              transition={{
                delay: 0.6 + index * 0.1,
                duration: 0.6,
                type: "spring",
                stiffness: 100
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
            >
              <GlassCard className="text-center p-4 min-w-32">
                <motion.div
                  animate={{
                    boxShadow: [
                      `0 0 0 rgba(59, 130, 246, 0)`,
                      `0 0 20px rgba(59, 130, 246, 0.3)`,
                      `0 0 0 rgba(59, 130, 246, 0)`
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3
                  }}
                  className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r ${node.color} rounded-full flex items-center justify-center text-white`}
                >
                  {node.icon}
                </motion.div>
                <h4 className="font-bold text-white text-sm mb-1">{node.title}</h4>
                <p className="text-xs text-zinc-400">{node.description}</p>
              </GlassCard>
            </motion.div>
          ))}

          {/* Connection Lines */}
          {ecosystemNodes.map(node =>
            node.connections.map((connectionId, connIndex) => {
              const targetNode = ecosystemNodes.find(n => n.id === connectionId);
              if (!targetNode) return null;

              return (
                <motion.div
                  key={`${node.id}-${connectionId}`}
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={isInView ? { opacity: 0.3, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
                  transition={{ delay: 1 + connIndex * 0.1, duration: 1 }}
                  className="absolute"
                  style={{
                    left: `${node.position.x}%`,
                    top: `${node.position.y}%`,
                    width: `${Math.abs(targetNode.position.x - node.position.x)}%`,
                    height: `${Math.abs(targetNode.position.y - node.position.y)}%`,
                    transform: `translate(-50%, -50%) rotate(${
                      targetNode.position.x > node.position.x
                        ? Math.atan((targetNode.position.y - node.position.y) / (targetNode.position.x - node.position.x)) * 180 / Math.PI
                        : 180 + Math.atan((targetNode.position.y - node.position.y) / (targetNode.position.x - node.position.x)) * 180 / Math.PI
                    }deg)`,
                  }}
                >
                  <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Características del ecosistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: <Globe className="w-6 h-6" />,
            title: "Global",
            description: "Acceso mundial sin restricciones",
            color: "from-blue-500 to-cyan-500"
          },
          {
            icon: <Zap className="w-6 h-6" />,
            title: "Instantáneo",
            description: "Transacciones en tiempo real",
            color: "from-yellow-500 to-orange-500"
          },
          {
            icon: <Lock className="w-6 h-6" />,
            title: "Seguro",
            description: "Protección máxima de activos",
            color: "from-green-500 to-emerald-500"
          },
          {
            icon: <Heart className="w-6 h-6" />,
            title: "Humano",
            description: "Diseñado para personas reales",
            color: "from-red-500 to-pink-500"
          }
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 1.5 + index * 0.1, duration: 0.6 }}
          >
            <GlassCard className="text-center h-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{
                  delay: 1.7 + index * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center text-white`}
              >
                {feature.icon}
              </motion.div>
              <h4 className="font-bold text-white mb-2">{feature.title}</h4>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Estadísticas del ecosistema */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 2 }}
        className="mt-16 text-center"
      >
        <GlassCard className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6">
            Un Ecosistema en Constante Evolución
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                24/7
              </motion.div>
              <div className="text-sm text-zinc-400">Operación continua</div>
            </div>

            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.5
                }}
                className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-1"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                99.9%
              </motion.div>
              <div className="text-sm text-zinc-400">Uptime garantizado</div>
            </div>

            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1
                }}
                className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                {"<1s"}
              </motion.div>
              <div className="text-sm text-zinc-400">Tiempo de respuesta</div>
            </div>

            <div>
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1.5
                }}
                className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-1"
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                ∞
              </motion.div>
              <div className="text-sm text-zinc-400">Escalabilidad</div>
            </div>
          </div>

          <p className="text-zinc-400 text-sm">
            Tecnología de vanguardia que crece contigo y con tus inversiones
          </p>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}