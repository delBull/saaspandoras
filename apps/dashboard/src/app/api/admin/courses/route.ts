import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "~/db";
import { courses, courseEnrollments } from "~/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// Seed data — full rich content for the 3 original courses
const SEED_COURSES = [
  {
    id: "defi-basics",
    title: "Fundamentos de DeFi",
    description: "Aprende los conceptos esenciales de las Finanzas Descentralizadas (DeFi): desde qué es una blockchain hasta cómo usar protocolos de lending, liquidity pools y yield farming de forma segura. Curso ideal para quienes dan sus primeros pasos en Web3.",
    category: "DeFi",
    difficulty: "beginner" as const,
    duration: "2 horas 30 min",
    xpReward: 100,
    creditsReward: 10,
    instructor: "Pandora's Education Team",
    prerequisites: [] as string[],
    skillsCovered: ["Blockchain Basics", "Wallets & Keys", "DEX Trading", "Lending & Borrowing", "Liquidity Pools", "Yield Farming", "Gas Fees", "Risk Management"],
    enrolledCount: 1247,
    completionRate: 68,
    orderIndex: 0,
    isActive: true,
    modules: [
      {
        id: "defi-m1",
        title: "Módulo 1: ¿Qué es DeFi?",
        type: "video",
        duration: "12 min",
        description: "En este módulo exploraremos los conceptos fundamentales de las finanzas descentralizadas, usando como base este excelente material introductorio.",
        content_url: "https://www.youtube.com/embed/HvUxwBU4oxA?si=m5S8W2aO-4L0Q-kU",
        content: null,
        is_free_preview: true,
      },
      {
        id: "defi-m2",
        title: "Módulo 2: Wallets & Claves Privadas",
        type: "article",
        duration: "15 min",
        description: "Todo lo que necesitas saber antes de interactuar con cualquier protocolo Web3.",
        content_url: null,
        content: `<h3>El portal a la Web3</h3>
<p>Una <strong>wallet</strong> (billetera) de criptomonedas no guarda realmente tus monedas; guarda las claves que demuestran que eres dueño de ellas en la blockchain. Actúa como tu cuenta bancaria, tu identidad y tu pasaporte en el mundo DeFi.</p>
<h4>Tipos principales de Wallets</h4>
<ul>
  <li><strong>Custodiales (Centralizadas):</strong> Como Binance o Coinbase. Ellos tienen tus claves. Si quiebran, pierdes tus fondos (<em>Not your keys, not your coins</em>).</li>
  <li><strong>No Custodiales (Descentralizadas):</strong> Como MetaMask, Phantom o Rabby. <strong>Tú</strong> tienes control total mediante una Frase Semilla (Seed Phrase).</li>
</ul>
<h4>La Frase Semilla (Seed Phrase)</h4>
<p>Es una serie de 12 a 24 palabras generadas aleatoriamente. Es la <strong>clave maestra</strong> de todos tus fondos. Reglas de oro:</p>
<ol>
  <li>Nunca la guardes en un archivo de texto, nube (Google Drive), o tomes captura de pantalla.</li>
  <li>Escríbela en papel y guárdala en un lugar seguro.</li>
  <li>Ningún soporte técnico real te la pedirá <strong>JAMÁS</strong>.</li>
</ol>
<p>Si pierdes tu frase semilla, pierdes tu dinero para siempre. No hay botón de "olvidé mi contraseña".</p>`,
        is_free_preview: true,
      },
      {
        id: "defi-m3",
        title: "Módulo 3: DEX — Intercambio Descentralizado",
        type: "article",
        duration: "18 min",
        description: "Cómo cambiar un token por otro sin pedir permiso a un banco ni intermediarios.",
        content_url: null,
        content: `<h3>Exchanges Descentralizados (DEX)</h3>
<p>Un DEX (Decentralized Exchange) es un mercado financiero que funciona 100% mediante contratos inteligentes (Smart Contracts), sin intermediarios ni empresas centrales.</p>
<h4>Cómo funcionan: El modelo AMM</h4>
<p>En lugar de conectar a un comprador con un vendedor directamente (como lo hace la bolsa tradicional), los DEX usan <strong>Automated Market Makers (AMM)</strong>.</p>
<ul>
  <li>Existe un "fondo de liquidez" (Pool) con dos tokens (ej. ETH y USDC).</li>
  <li>El precio se ajusta automáticamente mediante una fórmula matemática (la más famosa es <code>x * y = k</code>).</li>
  <li>Si mucha gente compra ETH del pool, hay menos ETH, por lo tanto su precio sube automáticamente.</li>
</ul>
<h4>Conceptos clave al usar un DEX</h4>
<ul>
  <li><strong>Slippage (Deslizamiento):</strong> La diferencia entre el precio al que esperas comprar y el precio real al que se ejecuta la transacción. Suele ocurrir si compras grandes cantidades o el mercado es muy volátil.</li>
  <li><strong>Gas Fees:</strong> El costo que pagas a la red (ej. Ethereum, Arbitrum) por procesar tu transacción.</li>
</ul>
<p><strong>DEXs Populares:</strong> Uniswap, Curve, PancakeSwap, Aerodrome.</p>`,
        is_free_preview: false,
      },
      {
        id: "defi-m4",
        title: "Módulo 4: Lending & Borrowing",
        type: "article",
        duration: "20 min",
        description: "El sistema de crédito y préstamos sobrecolateralizados en la blockchain.",
        content_url: null,
        content: `<h3>Préstamos Descentralizados</h3>
<p>Los protocolos de Lending (Préstamos) permiten a los usuarios prestar sus criptomonedas para ganar intereses, o pedir prestado usando sus activos como garantía.</p>
<h4>El concepto de Sobre-colateralización</h4>
<p>A diferencia del mundo real donde un banco evalúa tu historial crediticio, en DeFi los smart contracts no confían en ti. Para pedir un préstamo, debes depositar <strong>más valor</strong> del que pides. Por ejemplo:</p>
<ol>
  <li>Depositas $1,500 en Ethereum como garantía (Colateral).</li>
  <li>El protocolo te permite pedir prestado hasta $1,000 en USDC (Stablecoin).</li>
</ol>
<p>Esto asegura que el sistema sea siempre solvente.</p>
<h4>Riesgo de Liquidación</h4>
<p>¿Qué pasa si el precio de Ethereum cae fuertemente? Si el valor de tus $1,500 en ETH cae a $1,050, tu préstamo se vuelve riesgoso para el protocolo.</p>
<p>En ese momento ocurre una <strong>Liquidación</strong>: el smart contract vende automáticamente tu ETH para pagar la deuda y proteger a quienes prestaron el dinero. El objetivo principal al pedir prestado en DeFi es <strong>monitorear tu salud crediticia (Health Factor)</strong> para evitar ser liquidado.</p>`,
        is_free_preview: false,
      },
      {
        id: "defi-m5",
        title: "Módulo 5: Liquidity Pools & Yield Farming",
        type: "article",
        duration: "22 min",
        description: "Cómo puedes convertirte en un proveedor de liquidez y ganar las comisiones del mercado.",
        content_url: null,
        content: `<h3>Proveedores de Liquidez (LP)</h3>
<p>Como aprendimos en el Módulo 3, los DEX necesitan fondos para que la gente pueda tradear. Estos fondos son proveídos por los propios usuarios.</p>
<h4>Proveer Liquidez</h4>
<p>Puedes depositar dos tokens (ej. un valor igual de ETH y USDC) en una <strong>Liquidity Pool</strong>. A cambio:</p>
<ul>
  <li>Recibes un token que representa tu porcentaje en esa alberca de liquidez (LP Token).</li>
  <li>Ganas una parte de todas las <strong>comisiones (fees) de trading</strong> que la gente paga al usar el DEX.</li>
</ul>
<h4>Impermanent Loss (Pérdida Impermanente)</h4>
<p>El mayor riesgo de proveer liquidez se llama <em>Impermanent Loss</em>. Ocurre cuando el precio de tus tokens depositados cambia radicalmente comparado con cuando los depositaste. Si mantuvieras los tokens en tu wallet en lugar de ponerlos en la pool, habrías ganado más valor.</p>
<p>Por eso, las pools con tokens estables (USDC/USDT) tienen muy bajo riesgo de IL, pero pagan menos. Las pools con tokens volátiles pagan comisiones más altas para compensar el riesgo.</p>
<h4>Yield Farming</h4>
<p>Es la práctica de mover tus activos a través de múltiples protocolos DeFi para <strong>maximizar los retornos (rendimiento)</strong>. Los protocolos a menudo incentivan a los usuarios regalando su propio token nativo (además de las comisiones de trading) si depositan liquidez en su plataforma.</p>`,
        is_free_preview: false,
      },
      {
        id: "defi-m6",
        title: "Módulo 6: Seguridad y Gestión de Riesgo",
        type: "article",
        duration: "10 min",
        description: "No confíes, verifica. Prácticas vitales para sobrevivir en el entorno Web3.",
        content_url: null,
        content: `<h3>Sobrevivir en el Salvaje Oeste</h3>
<p>DeFi ofrece libertades financieras inigualables, pero esa misma libertad recae 100% en tu responsabilidad personal. No hay protección al consumidor ni seguro federal.</p>
<h4>Principales Riesgos</h4>
<ol>
  <li><strong>Bugs en Smart Contracts:</strong> Aunque el código sea ley, a veces la ley tiene errores. Los hackers explotan debilidades en el código para robar los fondos (Exploits).</li>
  <li><strong>Rug Pulls (Tirón de Alfombra):</strong> Los creadores de un proyecto se llevan el dinero de los inversores y desaparecen.</li>
  <li><strong>Phishing:</strong> Conectas tu wallet a una página falsa que imita a un DEX real e inmediatamente te vacían tus fondos al aprobar una transacción maliciosa.</li>
</ol>
<h4>Mejores Prácticas de Seguridad</h4>
<ul>
  <li>Usa marcadores (bookmarks) para acceder a los protocolos (nunca uses Google Search para entrar a Uniswap).</li>
  <li>Nunca interactúes con tokens aéreos (airdrops) que aparezcan misteriosamente en tu wallet y te pidan ir a una web a venderlos.</li>
  <li>Diversifica: No pongas todos tus fondos en un solo protocolo, por más seguro que parezca.</li>
  <li>Usa <strong>Hardware Wallets</strong> (Ledger/Trezor) para tus ahorros a largo plazo (Cold Storage) y una wallet en el navegador con poco dinero para interactuar en el día a día (Hot Wallet).</li>
</ul>`,
        is_free_preview: false,
      },
      {
        id: "defi-quiz",
        title: "Quiz Final: Fundamentos DeFi",
        type: "quiz",
        duration: "15 min",
        description: "Demuestra tus conocimientos para obtener tus recompensas (XP y Créditos). ¡Buena suerte!",
        content_url: null,
        content: null,
        is_free_preview: false,
        passing_score: 80,
        question_count: 5,
        questions: [
          {
            question: "¿Cuál es la principal diferencia entre una wallet Custodial y No Custodial?",
            options: ["Las custodiales son más seguras", "En las No Custodiales, tú tienes el control total de tus claves privadas", "Las No Custodiales no soportan Ethereum", "Las custodiales no requieren contraseñas"],
            correctIndex: 1
          },
          {
            question: "¿Qué es el 'Impermanent Loss' en DeFi?",
            options: ["Perder tu frase semilla", "Un bug en el smart contract", "El riesgo de que el valor de tus tokens cambie radicalmente al proveer liquidez frente a solo holdearlos", "Pagar demasiado gas"],
            correctIndex: 2
          },
          {
            question: "¿Qué mecanismo usan los DEXs modernos en lugar de un libro de órdenes tradicional?",
            options: ["Brokers centralizados", "Automated Market Makers (AMM)", "Proof of Work", "Mineros"],
            correctIndex: 1
          },
          {
            question: "En Lending & Borrowing, ¿por qué los préstamos son sobre-colateralizados?",
            options: ["Para ganar más intereses", "Porque los smart contracts no confían en historiales crediticios y necesitan asegurar la solvencia", "Para pagar menos gas", "Porque los bancos lo exigen"],
            correctIndex: 1
          },
          {
            question: "Si recibes tokens desconocidos (airdrop misterioso) en tu wallet, tu mejor acción en términos de OpSec es:",
            options: ["Ir a la web que sugieren y conectarla para venderlos", "Ignorarlos por completo, suelen ser phishing", "Enviarlos a un amigo", "Hacer swap en Uniswap"],
            correctIndex: 1
          },
          {
            question: "¿Qué es una Stablecoin?",
            options: ["Una criptomoneda cuyo valor está anclado a un activo estable como el Dólar (ej. USDC, USDT)", "Cualquier criptomoneda de la red Bitcoin", "Un token que no se puede vender", "Una blockchain privada"],
            correctIndex: 0
          },
          {
            question: "¿En qué se diferencia un protocolo DeFi de un Banco Tradicional?",
            options: ["Los bancos son de código abierto", "DeFi requiere que presentes identificación oficial (KYC) antes de usarlo", "Los protocolos DeFi operan mediante Smart Contracts transparentes las 24/7 sin CEO ni horarios físicos", "DeFi solo funciona de Lunes a Viernes"],
            correctIndex: 2
          },
          {
            question: "¿Qué sucede durante una Liquidación en un protocolo de Préstamos (Lending)?",
            options: ["El protocolo te perdona la deuda", "Tus garantías (colateral) son vendidas automáticamente por el Smart Contract porque su valor bajó demasiado respecto a tu deuda", "Recibes un bono extra de tokens", "Tienes 30 días adicionales para pagar"],
            correctIndex: 1
          },
          {
            question: "¿Por qué al hacer un Swap en un DEX apruebas primero el token y luego ejecutas el swap?",
            options: ["Porque así cobras menos comisiones", "Porque es una regla del gobierno", "La aprobación ('Approve') le da permiso al Smart Contract para mover ese token de tu wallet, el swap es la ejecución de la orden", "Para verificar tu identidad"],
            correctIndex: 2
          },
          {
            question: "¿Qué significa el concepto de 'Yield Farming'?",
            options: ["Cultivar vegetales en el metaverso", "Esconder tus tokens en una billetera fría", "Mover estratégicamente tus criptomonedas por diferentes protocolos DeFi para maximizar tus rendimientos e incentivos en forma de tokens", "Pagar para que un banco gestione tu portafolio"],
            correctIndex: 2
          }
        ],
      },
    ],
  },
  {
    id: "nft-strategies",
    title: "Estrategias NFTs Avanzadas",
    description: "Domina el ecosistema NFT desde la teoría hasta la práctica profesional. Aprende a evaluar colecciones, entender la tecnología detrás de los NFTs (ERC-721 vs ERC-1155), construir estrategias de flipping, y explorar utilidades como gaming, acceso gated y tokenización de activos reales.",
    category: "NFTs",
    difficulty: "advanced" as const,
    duration: "4 horas",
    xpReward: 150,
    creditsReward: 15,
    instructor: "NFT & Metaverse Specialist",
    prerequisites: ["defi-basics"] as string[],
    skillsCovered: ["ERC-721 & ERC-1155", "NFT Valuation", "Collection Analysis", "Flipping Strategy", "Rarity Scoring", "NFT Utilities", "Royalties & Marketplace", "GameFi", "Real World Assets"],
    enrolledCount: 892,
    completionRate: 45,
    orderIndex: 1,
    isActive: true,
    modules: [
      {
        id: "nft-m1",
        title: "Módulo 1: Tecnología detrás de los NFTs",
        type: "video",
        duration: "20 min",
        description: "ERC-721 vs ERC-1155 — cuándo usar cada uno. Metadata on-chain vs off-chain (IPFS, Arweave). Smart contracts de NFT: mint, burn, transfer. Gasless minting con EIP-712.",
        content_url: null,
        is_free_preview: true,
        content: null,
      },
      {
        id: "nft-m2",
        title: "Módulo 2: Análisis y Valoración de Colecciones",
        type: "video",
        duration: "25 min",
        description: "Cómo evaluar una colección antes de comprar: floor price, volume, holders, wallet distribution. Herramientas: NFTGo, Icy.tools, Nansen NFT God Mode. Red flags de rug pulls. Análisis de Bored Apes y Pudgy Penguins como casos de estudio.",
        content_url: null,
        is_free_preview: true,
        content: null,
      },
      {
        id: "nft-m3",
        title: "Módulo 3: Rarity Scoring & Trait Analysis",
        type: "video",
        duration: "18 min",
        description: "Cómo funciona el rarity score. Herramientas: Rarity Tools, Trait Sniper, Rarify. Cómo los traits afectan el precio. Estrategia de compra por traits subvalorados. Caso práctico: encontrar gems en una colección de 10k.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "nft-m4",
        title: "Módulo 4: Estrategias de Flipping",
        type: "video",
        duration: "30 min",
        description: "Flipping de bajo y alto riesgo. Sweep the floor strategy. Timing con lanzamientos (mint strategy). Uso de Blur vs OpenSea para trading activo. Gestión de portfolio NFT. Cómo calcular P&L real incluyendo gas y royalties.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "nft-m5",
        title: "Módulo 5: NFT Utilities — Más Allá del Arte",
        type: "video",
        duration: "22 min",
        description: "NFTs como passes de acceso gated. GameFi: NFTs en Axie Infinity, Gods Unchained, Parallel. Music NFTs (Sound.xyz, Catalog). NFTs de tickets y eventos. Real World Assets (RWA) tokenizados como NFTs.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "nft-m6",
        title: "Módulo 6: Crear y Lanzar tu Colección",
        type: "video",
        duration: "28 min",
        description: "Diseño y generación de layers con Hashlips. Deploy de contrato ERC-721 con OpenZeppelin + Hardhat. Configurar metadata en IPFS con Pinata. Listing en OpenSea y Blur. Royalty splits con 0xSplits.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "nft-m7",
        title: "Módulo 7: Royalties, Marketplaces y Regulación",
        type: "article",
        duration: "15 min",
        description: "La guerra de royalties en 2023-2024: quién los cobra y quién no. Blur vs OpenSea vs LooksRare. EIP-2981 — el estándar de royalties on-chain. Aspectos legales y fiscales de los NFTs en LATAM.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "nft-m8",
        title: "Módulo 8: NFTs en Pandora's Protocol",
        type: "video",
        duration: "20 min",
        description: "Cómo se usan los NFTs en el ecosistema Pandora's: Pandora's Key, acceso a protocolos, Pandora Box. Casos de uso: inversión fraccionada tokenizada como NFT. Roadmap de NFT utilities en la plataforma.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "nft-quiz",
        title: "Quiz Final: Estrategias NFT",
        type: "quiz",
        duration: "20 min",
        description: "20 preguntas sobre tecnología NFT, análisis de colecciones, flipping, utilities y lanzamiento. Necesitas 75% para aprobar. Obtén tu badge NFT Expert + recompensas de XP y Credits.",
        content_url: null,
        is_free_preview: false,
        content: null,
        passing_score: 75,
        question_count: 20,
      },
    ],
  },
  {
    id: "web3-security",
    title: "Seguridad Web3 Essentials",
    description: "Protege tus activos digitales con las mejores prácticas de seguridad en Web3. Aprende a identificar y evitar los vectores de ataque más comunes: phishing, rug pulls, drain attacks, smart contract exploits. Curso esencial para cualquier usuario de DeFi y NFTs.",
    category: "Security",
    difficulty: "intermediate" as const,
    duration: "3 horas",
    xpReward: 125,
    creditsReward: 12,
    instructor: "Web3 Security Specialist",
    prerequisites: ["defi-basics"] as string[],
    skillsCovered: ["Wallet Security", "Hardware Wallets", "Phishing Detection", "Smart Contract Auditing", "Rug Pull Detection", "Drain Attack Prevention", "OpSec", "Recovery Planning", "Multisig"],
    enrolledCount: 1563,
    completionRate: 72,
    orderIndex: 2,
    isActive: true,
    modules: [
      {
        id: "sec-m1",
        title: "Módulo 1: El Panorama de Amenazas Web3",
        type: "video",
        duration: "15 min",
        description: "Los mayores hacks de la historia cripto: Ronin ($625M), Wormhole ($320M), FTX. Tipos de amenazas: protocol exploits, social engineering, insider attacks. Por qué Web3 es un objetivo lucrativo para los hackers.",
        content_url: null,
        is_free_preview: true,
        content: null,
      },
      {
        id: "sec-m2",
        title: "Módulo 2: Seguridad de Wallets",
        type: "video",
        duration: "20 min",
        description: "Hot vs Cold wallets. Hardware wallets: Ledger vs Trezor — configuración y best practices. Never share your seed phrase — ni con soporte técnico. Cómo detectar wallets fake y extensiones maliciosas. Demo: configurar Ledger correctamente.",
        content_url: null,
        is_free_preview: true,
        content: null,
      },
      {
        id: "sec-m3",
        title: "Módulo 3: Phishing, Scams y Social Engineering",
        type: "video",
        duration: "22 min",
        description: "Anatomía de un ataque phishing Web3. Discord DMs falsos. Twitter / X fake accounts. Fake mints y airdrops maliciosos. Google Ads con links fraudulentos. Cómo verificar URLs y contratos antes de conectar tu wallet. Herramientas: ScamSniffer, Pocket Universe.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "sec-m4",
        title: "Módulo 4: Approvals — El Peligro Invisible",
        type: "video",
        duration: "18 min",
        description: "Qué son los token approvals y por qué son peligrosos. Infinite approval vs limited approval. Cómo revisar y revocar permisos con Revoke.cash y Etherscan. Cómo los drain attacks explotan approvals antiguos. Demo: limpiar una wallet comprometida.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "sec-m5",
        title: "Módulo 5: Rug Pulls — Cómo Identificarlos",
        type: "video",
        duration: "20 min",
        description: "Tipos de rug pulls: soft rug vs exit scam. Red flags en tokenomics: mint ilimitado, honeypot, bloqueado de vender. Herramientas de análisis: Token Sniffer, Honeypot.is, Etherscan. Casos reales: Squid Game Token, AnubisDAO.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "sec-m6",
        title: "Módulo 6: Auditorías de Smart Contracts",
        type: "article",
        duration: "15 min",
        description: "Cómo leer un reporte de auditoría. Principales firmas auditoras: Trail of Bits, OpenZeppelin, Certik, Sherlock. Vulnerabilidades comunes: reentrancy, integer overflow, access control. Por qué una auditoría no garantiza seguridad al 100%.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "sec-m7",
        title: "Módulo 7: OpSec — Seguridad Operacional",
        type: "article",
        duration: "18 min",
        description: "Separar tu identidad online de tus activos cripto. Usar wallets dedicadas: hot wallet para DeFi, cold wallet para largo plazo. VPN y privacidad. Password managers (Bitwarden, 1Password). 2FA: TOTP vs SMS — por qué nunca uses SMS. Protección contra SIM swapping.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "sec-m8",
        title: "Módulo 8: Multisig & Recovery Planning",
        type: "video",
        duration: "20 min",
        description: "Gnosis Safe — qué es y cómo configurar un multisig. Cuándo usar multisig: DAOs, fondos compartidos, proyectos. Plan de recuperación: guardado offline de seed phrases (planchas de metal). Herencia cripto: servicios legales y técnicos.",
        content_url: null,
        is_free_preview: false,
        content: null,
      },
      {
        id: "sec-quiz",
        title: "Quiz Final: Web3 Security",
        type: "quiz",
        duration: "15 min",
        description: "18 preguntas sobre seguridad de wallets, detección de scams, approvals, rug pulls y OpSec. Necesitas 80% para aprobar — la seguridad no es negociable. Obtén tu badge Security Expert + recompensas.",
        content_url: null,
        is_free_preview: false,
        content: null,
        passing_score: 80,
        question_count: 18,
      },
    ],
  },
];

// GET - All courses (including inactive) with enrollment stats
export async function GET(_request: Request) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        category: courses.category,
        difficulty: courses.difficulty,
        duration: courses.duration,
        xpReward: courses.xpReward,
        creditsReward: courses.creditsReward,
        instructor: courses.instructor,
        orderIndex: courses.orderIndex,
        isActive: courses.isActive,
        imageUrl: courses.imageUrl,
        modules: courses.modules, // 🔥 Add this line
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        totalEnrollments: sql<number>`cast(count(${courseEnrollments.id}) as integer)`,
        completedEnrollments: sql<number>`cast(count(case when ${courseEnrollments.status} = 'completed' then 1 end) as integer)`,
      })
      .from(courses)
      .leftJoin(courseEnrollments, eq(courses.id, courseEnrollments.courseId))
      .groupBy(courses.id)
      .orderBy(courses.orderIndex);

    return NextResponse.json({
      courses: allCourses,
      total: allCourses.length,
    });

  } catch (error) {
    console.error('[Admin Courses GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Create course OR seed
export async function POST(request: Request) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as any;

    // Seed action
    if (body.action === 'seed') {
      const results = [];
      for (const course of SEED_COURSES) {
        // Check if exists to report correctly to frontend
        const [existing] = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, course.id));
        const action = existing ? 'skipped' : 'created';

        // Upsert logic: insert or update if exists based on id
        const [upserted] = await db.insert(courses)
          .values(course)
          .onConflictDoUpdate({
            target: courses.id,
            set: {
              title: course.title,
              description: course.description,
              category: course.category,
              difficulty: course.difficulty,
              duration: course.duration,
              xpReward: course.xpReward,
              creditsReward: course.creditsReward,
              instructor: course.instructor,
              prerequisites: course.prerequisites,
              skillsCovered: course.skillsCovered,
              orderIndex: course.orderIndex,
              isActive: course.isActive,
              modules: course.modules,
              updatedAt: new Date()
            }
          })
          .returning();
        
        results.push({ id: course.id, action, data: upserted });
      }
      return NextResponse.json({ success: true, results });
    }

    // Create
    if (!body.id || !body.title || !body.description || !body.difficulty) {
      return NextResponse.json({ error: 'id, title, description, difficulty required' }, { status: 400 });
    }

    const [created] = await db.insert(courses).values({
      id: body.id,
      title: body.title,
      description: body.description,
      category: body.category || 'General',
      difficulty: body.difficulty,
      duration: body.duration || '1 hora',
      imageUrl: body.imageUrl,
      xpReward: body.xpReward ?? 50,
      creditsReward: body.creditsReward ?? 10,
      prerequisites: body.prerequisites ?? [],
      modules: body.modules ?? [],
      skillsCovered: body.skillsCovered ?? [],
      instructor: body.instructor ?? "Pandora's Team",
      orderIndex: body.orderIndex ?? 99,
      isActive: body.isActive ?? true,
    }).returning();

    return NextResponse.json({ success: true, course: created }, { status: 201 });

  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Duplicate course ID' }, { status: 409 });
    }
    console.error('[Admin Courses POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH - Update course
export async function PATCH(request: Request) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as any;
    if (!body.id) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    const { id, ...updates } = body;
    const [updated] = await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, course: updated });

  } catch (error) {
    console.error('[Admin Courses PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Soft-delete (isActive = false)
export async function DELETE(request: Request) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    await db
      .update(courses)
      .set({ isActive: false })
      .where(eq(courses.id, id));

    return NextResponse.json({ success: true, message: 'Course deactivated' });

  } catch (error) {
    console.error('[Admin Courses DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
