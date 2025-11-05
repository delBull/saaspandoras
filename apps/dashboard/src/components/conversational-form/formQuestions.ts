import type { FormQuestion } from './schema';

// Array de preguntas del formulario conversacional - Versión Utility Final
export const formQuestions: FormQuestion[] = [
  // SECCIÓN 1: La Identidad de tu Creación (6 preguntas)
  {
    id: 'title',
    label: '¡Hola, Creador! ¿Cómo se llama esta nueva Creación (Protocolo de Utilidad)?',
    placeholder: 'Ej: Pandora\'s DAO o Acceso Total NFT',
    component: 'text-input',
    // required: true, // Temporalmente no requerido para pruebas
    maxLength: 256,
  },
  {
    id: 'tagline',
    label: '¿Cuál es el eslogan o frase que resume el Valor o la Utilidad de tu Creación?',
    placeholder: 'Ej: Acceso ilimitado a nuestra comunidad por tu Labor.',
    component: 'text-input',
    maxLength: 140,
    info: 'Un eslogan memorable que capture la esencia de tu protocolo de utilidad. Debe enfocarse en el beneficio, no en la inversión.',
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
    // required: true, // Temporalmente no requerido para pruebas
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
    info: 'Documento que explica la visión, la tecnología, el modelo económico (tokenomics) y, crucialmente, la **mecánica de utilidad** de tu proyecto.',
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

  // SECCIÓN 3: La Utilidad y Economía de la Creación (9 preguntas)
  {
    id: 'fundUsage', // Mantiene la clave, pero cambia la pregunta
    label: 'Describa la mecánica del Protocolo: ¿Cómo se genera valor para la comunidad (ej. acceso, recompensas, contenido)?',
    placeholder: 'Ej: Los holders de Artefactos tendrán acceso prioritario a nuevos lanzamientos, podrán votar en funcionalidades, y recibirán recompensas por staking/labor...',
    component: 'textarea-input',
    info: 'Describe la regla fundamental de tu Creación. Explica el *beneficio tangible* que recibirán los poseedores del Artefacto.',
  },
  {
    id: 'lockupPeriod', // Mantiene la clave, pero cambia la pregunta
    label: '¿Cómo se mantiene la utilidad de los Artefactos a largo plazo?',
    placeholder: 'Ej: Actualizaciones continuas del protocolo, nuevos casos de uso desbloqueados por tenencia prolongada, recompensas por participación activa, acceso a eventos exclusivos...',
    component: 'textarea-input',
    info: 'Describe el plan para que el valor de uso (utilidad) se mantenga y crezca más allá del lanzamiento inicial. La clave es la *utilidad continua*.',
  },
  {
    id: 'applicantName', // Mantiene la clave, pero cambia la pregunta
    label: 'Si incluye \'Labor\' (Work-to-Earn), describa el mecanismo: ¿Qué es \'Labor\' y cómo se calculará la recompensa?',
    placeholder: 'Ej: Las acciones validadas incluyen: contribuir al DAO, moderar contenido. La recompensa se calcula por puntos acumulados semanalmente, canjeables por tokens adicionales o acceso premium...',
    component: 'textarea-input',
    info: 'Detalla cómo el sistema Work-to-Earn recompensa la contribución de la comunidad. Especifica las acciones y la fórmula de recompensa.',
  },
  {
    id: 'isMintable', // Mantiene la clave, pero cambia la pregunta
    label: '¿Tiene planes de integrar este Protocolo con otras herramientas/plataformas (Discord, e-commerce, Web3, etc.)?',
    component: 'checkbox-input',
    info: 'Marcar Sí si planeas integrar con otras plataformas. Describe las integraciones en el campo de descripción del proyecto.',
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
    info: 'Monto en USD que necesitas recaudar. Sé realista: un monto bien justificado genera confianza.',
  },
  {
    id: 'tokenType',
    label: '¿Cómo planeas representar la participación en tu Creación? (Tipo de Artefacto digital)',
    component: 'select-input',
    options: [
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
    info: 'El suministro total de Artefactos. Este número define la escasez del acceso.',
  },
  {
    id: 'tokensOffered',
    label: '¿Cuántos Artefactos ofrecerás a la comunidad en esta ronda?',
    placeholder: 'Ej: 1000000',
    component: 'number-input',
    info: 'Cantidad que se pondrá a disposición de la comunidad en esta fase.',
    relatedField: 'totalTokens',
  },
  {
    id: 'tokenPriceUsd',
    label: '¿Cuál será el precio (en USD) de cada Artefacto durante la recaudación?',
    placeholder: 'Ej: 0.10',
    component: 'number-input',
    info: 'El precio inicial de venta del Artefacto de Acceso.',
  },
  {
    id: 'recurringRewards',
    label: 'Estructura de Recompensa Recurrente',
    component: 'recurring-rewards-input',
  },

  // SECCIÓN 4: Datos del Creador (4 preguntas)
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

  // SECCIÓN 5: Transparencia y Estructura (Legal y Técnica) (6 preguntas)
  {
    id: 'legalStatus',
    label: '¿Cuál es el estatus legal de tu Creación y en qué jurisdicción opera?',
    placeholder: 'Ej: LLC en Delaware, USA o DAO sin fines de lucro',
    component: 'text-input',
    info: 'Información legal para demostrar la legitimidad de la entidad que gestiona la Creación.',
  },
  {
    id: 'fiduciaryEntity', // Mantiene la clave, pero cambia la pregunta
    label: 'Modelo de Monetización (Ingresos del Protocolo): ¿Cuál es el mecanismo principal que usará el Creador para generar ingresos y financiar las recompensas de Utilidad a largo plazo?',
    placeholder: 'Ej: Suscripciones con Artefactos, Tarifas por Uso del Servicio, Venta de Productos/Servicios.',
    component: 'text-input',
    maxLength: 256,
    info: 'Ej: Suscripciones con Artefactos, Tarifas por Uso del Servicio, Venta de Productos/Servicios.',
  },
  {
    id: 'valuationDocumentUrl', // Mantiene la clave, pero cambia la pregunta
    label: 'Describa la estrategia inicial para que la comunidad adquiera sus Artefactos de Acceso.',
    placeholder: 'Ej: 50% vía Airdrop a holders de X NFT, 50% vía venta a precio fijo, asignación por mérito/labor.',
    component: 'textarea-input',
    info: 'Describe cómo planeas distribuir inicialmente tus Artefactos. Incluye porcentajes, criterios de elegibilidad y fases de lanzamiento.',
  },
  {
    id: 'dueDiligenceReportUrl',
    label: '¿Cómo planea mitigar el riesgo operativo o el fraude dentro de su propia \'Creación\' y comunidad?',
    placeholder: 'Ej: MultiSig para tesorería, auditorías regulares, gobernanza comunitaria, seguros paramétricos...',
    component: 'textarea-input',
    info: 'Describe las medidas de seguridad y control que implementarás. Incluye: custodia de fondos, verificación de identidad, mecanismos de reporte, y protocolos de resolución de disputas.',
  },

];
