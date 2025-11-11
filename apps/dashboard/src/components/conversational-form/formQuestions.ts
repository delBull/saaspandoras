import type { FormQuestion } from './types';

// Array de preguntas del formulario conversacional - Versión Utility Final
export const formQuestions: FormQuestion[] = [
  // SECCIÓN 1: La Identidad de tu Creación (7 preguntas)
  {
    id: 'title',
    label: '¡Hola, Creador! ¿Cómo se llama esta nueva Creación (Protocolo de Utilidad)?',
    placeholder: 'Ej: Pandora\'s DAO o Acceso Total NFT',
    component: 'text-input',
    required: true,
    maxLength: 256,
  },
  {
    id: 'tagline',
    label: '¿Cuál es el eslogan o frase que resume el Valor o la Utilidad de tu Creación?',
    placeholder: 'Ej: Acceso ilimitado a nuestra comunidad por tu Labor.',
    component: 'text-input',
    required: true,
    maxLength: 140,
    info: 'Un eslogan memorable que capture la esencia de tu protocolo de utilidad. Debe enfocarse en el beneficio, no en la inversión.',
  },
  {
    id: 'description',
    label: 'Describe tu Creación: ¿Qué problema resuelve y cómo beneficia a tu comunidad?',
    placeholder: 'Ej: Mi protocolo conecta creadores con su audiencia a través de tokens de utilidad que dan acceso exclusivo a contenido premium, eventos y recompensas por participación activa.',
    component: 'textarea-input',
    required: true,
    info: 'Describe claramente qué hace tu protocolo, qué problema resuelve y cómo beneficia a los holders de tus Artefactos. Esta descripción aparecerá en tu página de proyecto.',
  },
  {
    id: 'businessCategory',
    label: 'Para ayudar a la Comunidad a descubrirla, ¿en qué categoría clasificarías tu Creación?',
    component: 'select-input',
    options: [
      { value: 'residential_real_estate', label: 'Bienes Raíces (Utilidad Inmobiliaria)' },
      { value: 'commercial_real_estate', label: 'Bienes Raíces (Acceso y Gobernanza)' },
      { value: 'tech_startup', label: 'Tech Startup (Membresía y Acceso)' },
      { value: 'renewable_energy', label: 'Energías Renovables (Recompensas y Gobernanza)' },
      { value: 'art_collectibles', label: 'Arte y Coleccionables (Acceso a Drops)' },
      { value: 'intellectual_property', label: 'Propiedad Intelectual (Derechos de Uso)' },
      { value: 'defi', label: 'DeFi (Protocolos de Staking/Yield)' },
      { value: 'gaming', label: 'Gaming y NFTs de Juegos (Utilidad In-Game)' },
      { value: 'metaverse', label: 'Metaverso y Real Estate Virtual (Acceso a Territorios)' },
      { value: 'music_audio', label: 'Música y NFTs de Audio (Derechos de Escucha/Drops)' },
      { value: 'sports_fan_tokens', label: 'Deportes y Fan Tokens (Votación y Beneficios)' },
      { value: 'education', label: 'Educación y Aprendizaje (Cursos y Certificados)' },
      { value: 'healthcare', label: 'Salud y Biotecnología (Acceso a Datos/Servicios)' },
      { value: 'supply_chain', label: 'Cadena de Suministro (Transparencia y Trazabilidad)' },
      { value: 'infrastructure', label: 'Infraestructura y DAO Tools (Utilidad de Herramientas)' },
      { value: 'social_networks', label: 'Redes Sociales Web3 (Membresía y Recompensas)' },
      { value: 'carbon_credits', label: 'Créditos de Carbono (Utilidad Ecológica)' },
      { value: 'insurance', label: 'Seguros Paramétricos (Acceso a Pólizas)' },
      { value: 'prediction_markets', label: 'Mercados de Predicción (Acceso y Votación)' },
      { value: 'other', label: 'Otro (Especificar en descripción)' },
    ],
    required: true,
    info: 'Selecciona la categoría que mejor describa la utilidad principal de tu protocolo. Esta clasificación ayuda a la comunidad a encontrar Creaciones relevantes.',
  },
  {
    id: 'logoUrl',
    label: 'Artefacto visual: Sube el logo que represente tu Creación.',
    placeholder: 'Haz click para seleccionar tu logo',
    component: 'file-input',
    info: 'Logo en PNG/SVG (recomendado 512x512px). Debe ser tu logo oficial y de alta calidad.',
  },
  {
    id: 'coverPhotoUrl',
    label: '¿Tienes una imagen de portada que capture el espíritu de tu Creación?',
    placeholder: 'Haz click para seleccionar tu imagen de portada',
    component: 'file-input',
    info: 'Imagen principal (JPG/PNG, máx. 1920x1080px). Será el fondo "hero" de tu página de protocolo.',
  },
  {
    id: 'videoPitch',
    label: '¿Tienes un video (YouTube/Vimeo) que muestre el alma y la utilidad de tu Creación?',
    placeholder: 'https://...',
    component: 'url-input',
    info: 'Enlace a tu video pitch o demo de utilidad. Muy recomendado para captar atención. (Máx. 3 minutos).',
  },

  // SECCIÓN 2: Conecta a tu Comunidad (6 preguntas)
  {
    id: 'website',
    label: '¿Dónde puede la Comunidad aprender más sobre tu Creación? (Sitio Web Oficial)',
    placeholder: 'https://tusitioweb.com',
    component: 'url-input',
    info: 'Tu sitio web oficial donde se describe la utilidad y el acceso que ofrece tu protocolo.',
  },
  {
    id: 'whitepaperUrl',
    label: '¿Tienes un "Litepaper" o documento de Visión que detalle el Protocolo de Utilidad?',
    placeholder: 'https://...',
    component: 'url-input',
    info: 'Documento que explica la visión, la tecnología, el modelo económico y, crucialmente, la **mecánica de utilidad** de tu proyecto. Si no la tienes, puedes continuar y crear una más adelante.',
  },
  {
    id: 'twitterUrl',
    label: '¿Cuál es tu cuenta de X (Twitter)?',
    placeholder: 'https://twitter.com/...',
    component: 'url-input',
    info: 'Tu cuenta oficial en X (Twitter) para comunicaciones con la comunidad.',
  },
  {
    id: 'discordUrl',
    label: '¿Dónde está tu comunidad en Discord?',
    placeholder: 'https://discord.gg/...',
    component: 'url-input',
    info: 'Servidor de Discord donde la comunidad puede interactuar y participar.',
  },
  {
    id: 'telegramUrl',
    label: '¿Tienes un grupo de Telegram?',
    placeholder: 'https://t.me/...',
    component: 'url-input',
    info: 'Grupo o canal de Telegram para anuncios importantes y comunicación directa.',
  },
  {
    id: 'linkedinUrl',
    label: '¿Cuál es tu perfil de LinkedIn (para mostrar credenciales del equipo)?',
    placeholder: 'https://linkedin.com/in/...',
    component: 'url-input',
    info: 'Perfil profesional de LinkedIn para mostrar la trayectoria del equipo principal.',
  },

  // SECCIÓN 3: La Utilidad y Economía de la Creación (10 preguntas)
  {
    id: 'protoclMecanism', // Nueva Clave
    label: 'Describa la mecánica del Protocolo: ¿Cómo se genera valor para la comunidad (ej. acceso, recompensas, contenido)?',
    placeholder: 'Ej: Los holders de Artefactos tendrán acceso prioritario a nuevos lanzamientos, podrán votar en funcionalidades, y recibirán recompensas por staking/labor...',
    component: 'textarea-input',
    info: 'Describe la regla fundamental de tu Creación. Explica el *beneficio tangible* que recibirán los poseedores del Artefacto.',
  },
  {
    id: 'artefactUtility', // Nueva Clave
    label: '¿Cómo se mantiene la utilidad de los Artefactos a largo plazo?',
    placeholder: 'Ej: Actualizaciones continuas del protocolo, nuevos casos de uso desbloqueados por tenencia prolongada, recompensas por participación activa, acceso a eventos exclusivos...',
    component: 'textarea-input',
    required: false,
    info: 'Describe el plan para que el valor de uso (utilidad) se mantenga y crezca más allá del lanzamiento inicial. La clave es la *utilidad continua*.',
  },
  {
    id: 'worktoearnMecanism', // Nueva Clave
    label: 'Si incluye \'Labor\' (Work-to-Earn), describa el mecanismo: ¿Qué es \'Labor\' y cómo se calculará la recompensa?',
    placeholder: 'Ej: Las acciones validadas incluyen: contribuir al DAO, moderar contenido. La recompensa se calcula por puntos acumulados semanalmente, canjeables por tokens adicionales o acceso premium...',
    component: 'textarea-input',
    required: false,
    info: 'Detalla cómo el sistema Work-to-Earn recompensa la contribución de la comunidad. Especifica las acciones y la fórmula de recompensa.',
  },
  {
    id: 'integrationPlan', // Nueva Clave
    label: '¿Tiene planes de integrar este Protocolo con otras herramientas/plataformas (Discord, e-commerce, Web3, etc.)?',
    component: 'checkbox-input',
    info: 'Marcar Sí, si planeas integrar con otras plataformas, o deja sin marcar si no sabes o no lo harás en este momento.',
  },
  {
    id: 'targetAmount',
    label: 'Para que esta Creación cobre vida, ¿cuántos Recursos (en USD) necesita recaudar de la comunidad en esta ronda?',
    placeholder: 'Ej: 100000',
    component: 'select-input',
    options: [
      { value: 'not_sure', label: 'Aún no estoy seguro(a)' },
      { value: '50000', label: '$50,000' },
      { value: '100000', label: '$100,000' },
      { value: '250000', label: '$250,000' },
      { value: '500000', label: '$500,000' },
      { value: '1000000', label: '$1,000,000' },
      { value: 'custom', label: 'Otro monto (especificar)' },
    ],
    required: true,
    info: 'Monto en USD que necesitas recaudar. Sé realista: un monto bien justificado genera confianza.',
  },
  {
    id: 'tokenType',
    label: '¿Cómo planeas representar la participación en tu Creación? (Tipo de Artefacto digital)',
    component: 'select-input',
    options: [
      { value: 'not_sure', label: 'Aún no estoy seguro(a)' },
      { value: 'erc20', label: 'Fungible (ERC-20) - Para recompensas o gobernanza' },
      { value: 'erc721', label: 'No Fungible (ERC-721/NFT) - Para acceso o identidad' },
      { value: 'erc1155', label: 'Semi-Fungible (ERC-1155) - Para combinar ambos tipos' },
    ],
    info: 'Elige el estándar que mejor se adapte al uso y la escasez de tu Artefacto de Acceso.',
  },
  {
    id: 'totalTokens',
    label: 'Definamos los Artefactos. ¿Cuántos Artefactos existirán en total (Supply Total)?',
    placeholder: 'Ej: 10000000',
    component: 'number-input',
    info: 'El suministro total de Artefactos. Este número define la escasez del acceso. Si aún no lo sabes, elige un número alto y ajustaremos más adelante.',
  },
  {
    id: 'tokensOffered',
    label: '¿Cuántos Artefactos ofrecerás a la comunidad en esta ronda?',
    placeholder: 'Ej: 1000000',
    component: 'number-input',
    info: 'Cantidad que se pondrá a disposición de la comunidad en esta fase. Si aún no lo sabes, elige un número la misma cnatidad del paso anterior.',
    relatedField: 'totalTokens',
  },
  {
    id: 'tokenPriceUsd',
    label: '¿Cuál será el precio (en USD) de cada Artefacto durante la recaudación?',
    placeholder: 'Ej: 0.10',
    component: 'number-input',
    info: 'El precio inicial de venta del Artefacto de Acceso. Sí aún no lo sabes, elige un valor bajo para maximizar la adopción inicial.',
  },
  {
    id: 'recurringRewards',
    label: 'Estructura de Recompensa Recurrente',
    component: 'recurring-rewards-input',
  },

  // SECCIÓN 4: Datos del Creador (5 preguntas)
  {
    id: 'applicantName',
    label: '¿Cuál es tu nombre completo?',
    placeholder: 'Bruce Wayne',
    component: 'text-input',
    required: true,
    info: 'Usar tu nombre legal completo (o el del representante principal) genera confianza inmediata en la comunidad. La transparencia es la base de un Protocolo de Utilidad exitoso.',
  },
  {
    id: 'applicantPosition',
    label: '¿Cuál es tu rol en este proyecto de utilidad?',
    placeholder: 'Ej: Fundador y CEO',
    component: 'text-input',
    info: 'Tu posición oficial en el proyecto. Esta información es pública.',
  },
  {
    id: 'applicantEmail',
    label: '¿Cuál es tu email? Lo usaremos para mantenerte al tanto del progreso.',
    placeholder: 'tu@email.com',
    component: 'text-input',
    required: true,
  },
  {
    id: 'applicantPhone',
    label: '¿Tienes un número de teléfono para contacto urgente? (opcional)',
    placeholder: '+1 234 567 8900',
    component: 'text-input',
    maxLength: 50,
    info: 'Número de teléfono para comunicaciones urgentes de la plataforma.',
  },
  {
    id: 'applicantWalletAddress',
    label: 'Dirección de tu Billetera (Wallet) de Creador.',
    placeholder: 'Se llenará automáticamente con tu billetera conectada',
    component: 'text-input',
    info: 'La dirección de tu billetera principal que se vinculará a la Creación para gobernanza y tarifas. Si no sabes cuál usar o no puedes decidir ahora, no te preocupes, podemos ayudarte más adelante.',
  },

  // SECCIÓN 5: Transparencia y Estructura (Legal y Técnica) (4 preguntas)
  {
    id: 'legalStatus',
    label: '¿Cuál es el estatus legal de tu Creación y en qué jurisdicción opera?',
    component: 'select-input',
    options: [
      // México - Personas Físicas
      { value: 'persona_fisica_mexico', label: '🇲🇽 Persona Física (México)' },

      // México - Entidades Jurídicas
      { value: 'sociedad_civil_mexico', label: '🇲🇽 Sociedad Civil (México)' },
      { value: 'sapi_mexico', label: '🇲🇽 Sociedad Anónima Promotora de Inversión (México)' },
      { value: 'sapib_mexico', label: '🇲🇽 Sociedad Anónima Promotora de Inversión Bursátil (México)' },
      { value: 'srl_mexico', label: '🇲🇽 Sociedad de Responsabilidad Limitada (México)' },
      { value: 'sa_mexico', label: '🇲🇽 Sociedad Anónima (México)' },
      { value: 'sc_mexico', label: '🇲🇽 Sociedad Cooperativa (México)' },
      { value: 'asociacion_civil_mexico', label: '🇲🇽 Asociación Civil (México)' },
      { value: 'fundacion_mexico', label: '🇲🇽 Fundación (México)' },
      { value: 'cooperativa_mexico', label: '🇲🇽 Cooperativa (México)' },
      { value: 'otra_entidad_mexico', label: '🇲🇽 Otra Entidad (México)' },

      // USA - Delaware (popular para Web3)
      { value: 'llc_delaware_usa', label: '🇺🇸 LLC (Delaware, USA)' },
      { value: 'corporation_delaware_usa', label: '🇺🇸 Corporation (Delaware, USA)' },

      // USA - California
      { value: 'llc_california_usa', label: '🇺🇸 LLC (California, USA)' },
      { value: 'corporation_california_usa', label: '🇺🇸 Corporation (California, USA)' },

      // USA - Personas Físicas y otras
      { value: 'persona_fisica_usa', label: '🇺🇸 Persona Física (USA)' },
      { value: 'dao_usa', label: '🇺🇸 DAO - Organización Autónoma Descentralizada (USA)' },
      { value: 'otra_entidad_usa', label: '🇺🇸 Otra Entidad (USA)' },

      // Opciones generales
      { value: 'sin_entidad_juridica', label: '🚫 Aún no tengo entidad jurídica' },
      { value: 'otra_jurisdiccion', label: '🌍 Otra jurisdicción (especificar en comentarios)' },
    ],
    required: true,
    info: 'Selecciona el estatus legal que mejor describe tu entidad. Si aún no tienes constituida una entidad jurídica, selecciona "Aún no tengo entidad jurídica".',
  },
  {
    id: 'monetizationModel',
    label: 'Modelo de Monetización (Ingresos del Protocolo)',
    placeholder: 'Ej: Suscripciones con Artefactos, Tarifas por Uso del Servicio..',
    component: 'text-input',
    required: true,
    maxLength: 256,
    info: '¿Cuál es el mecanismo principal que usará el Creador para generar ingresos y financiar las recompensas de Utilidad a largo plazo?',
  },
  {
    id: 'adquireStrategy',
    label: 'Describa la estrategia inicial para que la comunidad adquiera sus Artefactos de Acceso.',
    component: 'textarea-input',
    required: false,
    info: 'Describe cómo planeas distribuir inicialmente tus Artefactos. Incluye porcentajes, criterios de elegibilidad y fases de lanzamiento.',
  },
  {
    id: 'mitigationPlan',
    label: '¿Cómo planea mitigar el riesgo operativo o el fraude dentro de su propia \'Creación\' y comunidad?',
    placeholder: 'Ej: MultiSig para tesorería, auditorías regulares, gobernanza comunitaria, seguros paramétricos...',
    component: 'textarea-input',
    info: 'Describe las medidas de seguridad y control que implementarás. Incluye: custodia de fondos, verificación de identidad, mecanismos de reporte, y protocolos de resolución de disputas.',
  },

];
