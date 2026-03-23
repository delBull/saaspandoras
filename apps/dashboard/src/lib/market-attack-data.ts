export interface LaunchStep {
  day: number;
  type: "awareness" | "opportunity" | "conversion";
  asset: "hook" | "script" | "cta";
  description: string;
}

export interface MarketAttackContent {
  core: {
    title: string;
    desire: string;
    enemy: string;
    mechanism: string;
    narrative: string;
  };
  whatToSay: {
    hooks: string[];
    angles: string[];
    emotions: string[];
    scripts: string[];
    ctas: string[];
  };
  howTheyConvert: {
    steps: string[];
  };
  launchSequence: LaunchStep[];
}

export const marketAttackData: { pandora: MarketAttackContent; project: MarketAttackContent } = {
  pandora: {
    core: {
      title: "Acceso antes que otros",
      desire: "Entrar en oportunidades antes de que existan",
      enemy: "Llegar tarde / Sistema tradicional",
      mechanism: "Acceso estructurado a oportunidades tempranas",
      narrative: "No es inversión. Es entrar antes.",
    },
    whatToSay: {
      hooks: [
        "La mayoría nunca ve esto.",
        "Esto no está hecho para el público.",
        "Aquí es donde empiezan las oportunidades.",
        "No es contenido. Es acceso.",
        "El 99% está mirando el lugar equivocado.",
        "Tu ventaja competitiva acaba de aparecer.",
      ],
      angles: [
        "Acceso anticipado",
        "Sistema oculto",
        "Inteligencia estructurada",
        "Ventaja informativa",
      ],
      emotions: [
        "FOMO",
        "Curiosidad",
        "Exclusividad",
        "Confianza",
      ],
      scripts: [
        "Esto no es una plataforma normal.\n\nAquí no vienes a consumir contenido.\n\nVienes a ver oportunidades antes de que existan afuera.\n\nSi entiendes esto, entras diferente.\n\nExplora Pandora.",
        "La mayoría llega cuando todo ya está validado.\n\nAquí es antes.\n\nAntes del ruido.\nAntes del mercado.\nAntes del acceso público.\n\nNo es para todos.\n\nExplóralo.",
        "Mientras otros esperan que el mercado les diga qué hacer, nosotros estamos construyendo el acceso directo.\n\nNo es especulación, es infraestructura.",
      ],
      ctas: [
        "Explorar acceso",
        "Entrar al sistema",
        "Ver oportunidades",
        "Acceder antes",
        "Reclamar ventaja",
      ],
    },
    howTheyConvert: {
      steps: ["Scroll", "Intriga", "Click", "Lead", "Trust", "Buy"],
    },
    launchSequence: [
      {
        day: 1,
        type: "awareness",
        asset: "hook",
        description: "1. Get attention (Awareness)",
      },
      {
        day: 2,
        type: "opportunity",
        asset: "script",
        description: "2. Show the opportunity",
      },
      {
        day: 3,
        type: "conversion",
        asset: "cta",
        description: "3. Drive action (Conversion)",
      },
    ],
  },
  project: {
    core: {
      title: "Entrada temprana a un activo real",
      desire: "Posicionarse en una fase de crecimiento explosivo",
      enemy: "Inflación / Activos sin respaldo",
      mechanism: "Acceso directo a activos reales tokenizados",
      narrative: "No estás comprando un inmueble. Estás entrando antes que otros.",
    },
    whatToSay: {
      hooks: [
        "Esto todavía no es público.",
        "Este proyecto aún no está en el mercado.",
        "La mayoría verá esto demasiado tarde.",
        "Esto no es inversión abierta.",
        "Acabamos de abrir una ventana de 72 horas.",
        "El activo real más líquido que verás hoy.",
      ],
      angles: [
        "Early access",
        "Activo real",
        "Fase temprana",
        "Exclusividad",
      ],
      emotions: [
        "Urgencia",
        "Seguridad",
        "Codicia",
        "Miedo a perderse algo",
      ],
      scripts: [
        "Esto no es un render más.\n\nEs un activo real en fase temprana.\n\nLa diferencia está en cuándo entras.\n\nLa mayoría lo verá cuando ya esté validado.\n\nAquí no.\n\nExplora el acceso.",
        "Esto no está abierto al público.\n\nY no todos pueden entrar.\n\nEstamos estructurando el acceso desde etapas tempranas.\n\nSi entiendes esto antes, juegas diferente.\n\nExplora Narai.",
        "No estás comprando un inmueble.\n\nEstás entrando antes que otros.\n\nEso es lo único que importa.\n\nExplora cómo funciona.",
      ],
      ctas: [
        "Explorar el proyecto",
        "Ver acceso",
        "Entender cómo entrar",
        "Acceder temprano",
        "Entrar a la Whitelist",
      ],
    },
    howTheyConvert: {
      steps: ["Scroll", "Intriga", "Click", "Lead", "Trust", "Buy"],
    },
    launchSequence: [
      {
        day: 1,
        type: "awareness",
        asset: "hook",
        description: "1. Get attention (Awareness)",
      },
      {
        day: 2,
        type: "opportunity",
        asset: "script",
        description: "2. Show the opportunity",
      },
      {
        day: 3,
        type: "conversion",
        asset: "cta",
        description: "3. Drive action (Conversion)",
      },
    ],
  },
};
