// WHATSAPP v3.0 - Configuración de las 8 preguntas filtradas
export const WHATSAPP_FLOW_CONFIG = {
  // Mensaje de bienvenida optimizado
  welcome: {
    id: "welcome",
    text: "¡Gracias por tu interés en lanzar tu Protocolo de Utilidad dentro de Pandora's!\n\nAntes de avanzar al módulo técnico, necesitamos validar algunos puntos clave sobre tu Creación.\n\nTe haré unas preguntas rápidas para confirmar su viabilidad. ¿Listo?",
    quickReplies: [
      { id: "start", title: "✔ Sí, comenzar" },
      { id: "info", title: "❓ ¿Qué es un Protocolo de Utilidad?" }
    ]
  },

  // Las 8 preguntas críticas filtradas
  questions: [
    {
      id: "mechanic",
      question: "¿Cuál es la acción verificable que realiza el usuario dentro de tu Creación?\n\n(Lo que podemos medir, validar y recompensar).\n\nExplica brevemente cómo funciona.",
      component: "text",
      help: "Busca algo que podamos medir automáticamente: moderación, completar tareas, votar, validar datos, etc.",
      validation: {
        type: "text",
        minLength: 10,
        maxLength: 500
      }
    },
    {
      id: "flow",
      question: "Explica cómo interactúa un usuario final con tu Protocolo paso a paso.\n\nIncluye: qué hace, qué recibe, y cómo se activa cada utilidad.",
      component: "text",
      help: "Ej: Compra acceso → completa misiones → recibe recompensas.",
      validation: {
        type: "text",
        minLength: 20,
        maxLength: 800
      }
    },
    {
      id: "roles",
      question: "¿Quién administrará tu Protocolo dentro de Pandora?\n\nIndica:\n– Nombre\n– Correo oficial\n– Rol (fundador / operador / CM)",
      component: "text",
      help: "Persona responsable para contactar.",
      validation: {
        type: "text",
        requiredFields: ["nombre", "correo", "@"],
        minLength: 15
      }
    },
    {
      id: "stage",
      question: "¿En qué etapa está actualmente tu Protocolo?",
      component: "select",
      options: [
        "Idea",
        "MVP",
        "En operación",
        "Comunidad activa",
        "Primeras ventas"
      ],
      validation: {
        type: "select",
        validOptions: [1, 2, 3, 4, 5]
      }
    },
    {
      id: "goal",
      question: "¿Cuál es tu objetivo al lanzar tu Protocolo dentro de Pandora's?\n\n(Accesos, misiones, recompensas, comunidad, membresías, ventas, etc.)",
      component: "text",
      help: "Sé específico sobre qué quieres lograr.",
      validation: {
        type: "text",
        minLength: 10,
        maxLength: 300
      }
    },
    {
      id: "team",
      question: "¿Con cuántas personas cuenta tu proyecto actualmente?",
      component: "select",
      options: [
        "Solo yo",
        "2–4 personas",
        "5+"
      ],
      followupQuestion: "¿Quién será el responsable técnico?",
      validation: {
        type: "select",
        validOptions: [1, 2, 3]
      }
    },
    {
      id: "audience",
      question: "¿Tu proyecto ya cuenta con comunidad o audiencia?\n\nElige todas las que apliquen.",
      component: "multi-select",
      options: [
        "No existe audiencia",
        "< 50",
        "50–200",
        "200–1000",
        "1000+",
        "Comunidad activa en redes",
        "Comunidad compradora real",
        "Comunidad privada (Discord/Telegram)"
      ],
      validation: {
        type: "multi-select",
        validRange: [1, 2, 3, 4, 5, 6, 7, 8]
      }
    },
    {
      id: "launchDate",
      question: "¿Cuál es tu fecha estimada para lanzar la primera versión de tu Protocolo?\n\n(YYYY-MM-DD o 'próximo mes')",
      component: "text",
      help: "Ayuda a entender tu timeline real.",
      validation: {
        type: "text",
        minLength: 3,
        maxLength: 100
      }
    }
  ],

  // Mensaje final de convergencia
  final: {
    id: "final",
    text: "Gracias, Creador.\n\nHemos registrado tu información.\n\nAhora completa la última capa para formalizar tu Protocolo aquí 👇\n\n🔗 pandor.as/apply",
    quickReplies: [
      { id: "apply", title: "Completar Apply" }
    ]
  },

  // Estados para admin management
  adminStates: {
    pending: "¡Felicidades! Tu aplicación pasó nuestro filtro inicial y está en revisión activa.\n\nUn estratega de arquitectura se pondrá en contacto 24/48h.\n\nTiempo estimado: 24/48h.",
    approved: "Tu arquitectura ha sido aprobada.\n\nTu Protocolo ya está parametrizado y listo para deployment en la ModularFactory.\n\nAgenda tu llamada final aquí: [Link Calendly]."
  }
} as const;

// Quick info responses
export const WHATSAPP_QUICK_INFO = {
  "info": "Un Protocolo de Utilidad es un sistema donde las acciones verificables del usuario generan valor o recompensas.\n\nEjemplos: tareas medibles, contenido curado, flujos verificables, aportes reales."
} as const;

// Export types for TypeScript
export type WhatsAppQuestionId = (typeof WHATSAPP_FLOW_CONFIG.questions)[number]['id'];
