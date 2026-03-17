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
        description: "Introducción a las finanzas descentralizadas. Diferencias entre DeFi y finanzas tradicionales. Historia y evolución desde Bitcoin hasta Ethereum y los smart contracts.",
        content_url: null,
        is_free_preview: true,
      },
      {
        id: "defi-m2",
        title: "Módulo 2: Wallets & Claves Privadas",
        type: "video",
        duration: "15 min",
        description: "Cómo funcionan las wallets (MetaMask, Rainbow, Rabby). La diferencia entre custodial y non-custodial. Cómo guardar tu seed phrase de forma segura. Demo: crear y configurar MetaMask.",
        content_url: null,
        is_free_preview: true,
      },
      {
        id: "defi-m3",
        title: "Módulo 3: DEX — Intercambio Descentralizado",
        type: "video",
        duration: "18 min",
        description: "Cómo funcionan los DEX (Uniswap, SushiSwap, Curve). Automated Market Makers (AMM). Slippage, price impact y cómo minimizarlos. Demo práctica: hacer un swap en Uniswap.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "defi-m4",
        title: "Módulo 4: Lending & Borrowing",
        type: "video",
        duration: "20 min",
        description: "Protocolos de préstamo: Aave, Compound, Spark. Tasas de interés variables y fijas. Colateral y liquidaciones. Cómo usar tu ETH como colateral para pedir un préstamo en USDC.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "defi-m5",
        title: "Módulo 5: Liquidity Pools & Yield Farming",
        type: "video",
        duration: "22 min",
        description: "Qué es una liquidity pool. Impermanent loss explicado con ejemplos. Cómo proveer liquidez en Uniswap v3. Yield farming: estrategias básicas para maximizar rendimientos.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "defi-m6",
        title: "Módulo 6: Gas Fees & Optimización",
        type: "article",
        duration: "10 min",
        description: "Cómo funcionan las gas fees en Ethereum. Layer 2s (Arbitrum, Optimism, Base) para reducir costos. Cuándo transaccionar para pagar menos gas. Herramientas: ETH Gas Station, Blocknative.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "defi-m7",
        title: "Módulo 7: Gestión de Riesgo en DeFi",
        type: "article",
        duration: "12 min",
        description: "Riesgos principales: smart contract bugs, rug pulls, oracle manipulation. Cómo diversificar en DeFi. Herramientas de análisis: DeFiLlama, DeBank, Zapper. Seguros DeFi: Nexus Mutual.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "defi-quiz",
        title: "Quiz Final: Fundamentos DeFi",
        type: "quiz",
        duration: "15 min",
        description: "Pon a prueba lo aprendido. 15 preguntas sobre wallets, DEX, lending, liquidity pools y gestión de riesgo. Necesitas 70% para aprobar y recibir tu certificado + recompensas.",
        content_url: null,
        is_free_preview: false,
        passing_score: 70,
        question_count: 15,
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
      },
      {
        id: "nft-m2",
        title: "Módulo 2: Análisis y Valoración de Colecciones",
        type: "video",
        duration: "25 min",
        description: "Cómo evaluar una colección antes de comprar: floor price, volume, holders, wallet distribution. Herramientas: NFTGo, Icy.tools, Nansen NFT God Mode. Red flags de rug pulls. Análisis de Bored Apes y Pudgy Penguins como casos de estudio.",
        content_url: null,
        is_free_preview: true,
      },
      {
        id: "nft-m3",
        title: "Módulo 3: Rarity Scoring & Trait Analysis",
        type: "video",
        duration: "18 min",
        description: "Cómo funciona el rarity score. Herramientas: Rarity Tools, Trait Sniper, Rarify. Cómo los traits afectan el precio. Estrategia de compra por traits subvalorados. Caso práctico: encontrar gems en una colección de 10k.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "nft-m4",
        title: "Módulo 4: Estrategias de Flipping",
        type: "video",
        duration: "30 min",
        description: "Flipping de bajo y alto riesgo. Sweep the floor strategy. Timing con lanzamientos (mint strategy). Uso de Blur vs OpenSea para trading activo. Gestión de portfolio NFT. Cómo calcular P&L real incluyendo gas y royalties.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "nft-m5",
        title: "Módulo 5: NFT Utilities — Más Allá del Arte",
        type: "video",
        duration: "22 min",
        description: "NFTs como passes de acceso gated. GameFi: NFTs en Axie Infinity, Gods Unchained, Parallel. Music NFTs (Sound.xyz, Catalog). NFTs de tickets y eventos. Real World Assets (RWA) tokenizados como NFTs.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "nft-m6",
        title: "Módulo 6: Crear y Lanzar tu Colección",
        type: "video",
        duration: "28 min",
        description: "Diseño y generación de layers con Hashlips. Deploy de contrato ERC-721 con OpenZeppelin + Hardhat. Configurar metadata en IPFS con Pinata. Listing en OpenSea y Blur. Royalty splits con 0xSplits.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "nft-m7",
        title: "Módulo 7: Royalties, Marketplaces y Regulación",
        type: "article",
        duration: "15 min",
        description: "La guerra de royalties en 2023-2024: quién los cobra y quién no. Blur vs OpenSea vs LooksRare. EIP-2981 — el estándar de royalties on-chain. Aspectos legales y fiscales de los NFTs en LATAM.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "nft-m8",
        title: "Módulo 8: NFTs en Pandora's Protocol",
        type: "video",
        duration: "20 min",
        description: "Cómo se usan los NFTs en el ecosistema Pandora's: Pandora's Key, acceso a protocolos, Pandora Box. Casos de uso: inversión fraccionada tokenizada como NFT. Roadmap de NFT utilities en la plataforma.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "nft-quiz",
        title: "Quiz Final: Estrategias NFT",
        type: "quiz",
        duration: "20 min",
        description: "20 preguntas sobre tecnología NFT, análisis de colecciones, flipping, utilities y lanzamiento. Necesitas 75% para aprobar. Obtén tu badge NFT Expert + recompensas de XP y Credits.",
        content_url: null,
        is_free_preview: false,
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
      },
      {
        id: "sec-m2",
        title: "Módulo 2: Seguridad de Wallets",
        type: "video",
        duration: "20 min",
        description: "Hot vs Cold wallets. Hardware wallets: Ledger vs Trezor — configuración y best practices. Never share your seed phrase — ni con soporte técnico. Cómo detectar wallets fake y extensiones maliciosas. Demo: configurar Ledger correctamente.",
        content_url: null,
        is_free_preview: true,
      },
      {
        id: "sec-m3",
        title: "Módulo 3: Phishing, Scams y Social Engineering",
        type: "video",
        duration: "22 min",
        description: "Anatomía de un ataque phishing Web3. Discord DMs falsos. Twitter / X fake accounts. Fake mints y airdrops maliciosos. Google Ads con links fraudulentos. Cómo verificar URLs y contratos antes de conectar tu wallet. Herramientas: ScamSniffer, Pocket Universe.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "sec-m4",
        title: "Módulo 4: Approvals — El Peligro Invisible",
        type: "video",
        duration: "18 min",
        description: "Qué son los token approvals y por qué son peligrosos. Infinite approval vs limited approval. Cómo revisar y revocar permisos con Revoke.cash y Etherscan. Cómo los drain attacks explotan approvals antiguos. Demo: limpiar una wallet comprometida.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "sec-m5",
        title: "Módulo 5: Rug Pulls — Cómo Identificarlos",
        type: "video",
        duration: "20 min",
        description: "Tipos de rug pulls: soft rug vs exit scam. Red flags en tokenomics: mint ilimitado, honeypot, bloqueado de vender. Herramientas de análisis: Token Sniffer, Honeypot.is, Etherscan. Casos reales: Squid Game Token, AnubisDAO.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "sec-m6",
        title: "Módulo 6: Auditorías de Smart Contracts",
        type: "article",
        duration: "15 min",
        description: "Cómo leer un reporte de auditoría. Principales firmas auditoras: Trail of Bits, OpenZeppelin, Certik, Sherlock. Vulnerabilidades comunes: reentrancy, integer overflow, access control. Por qué una auditoría no garantiza seguridad al 100%.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "sec-m7",
        title: "Módulo 7: OpSec — Seguridad Operacional",
        type: "article",
        duration: "18 min",
        description: "Separar tu identidad online de tus activos cripto. Usar wallets dedicadas: hot wallet para DeFi, cold wallet para largo plazo. VPN y privacidad. Password managers (Bitwarden, 1Password). 2FA: TOTP vs SMS — por qué nunca uses SMS. Protección contra SIM swapping.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "sec-m8",
        title: "Módulo 8: Multisig & Recovery Planning",
        type: "video",
        duration: "20 min",
        description: "Gnosis Safe — qué es y cómo configurar un multisig. Cuándo usar multisig: DAOs, fondos compartidos, proyectos. Plan de recuperación: guardado offline de seed phrases (planchas de metal). Herencia cripto: servicios legales y técnicos.",
        content_url: null,
        is_free_preview: false,
      },
      {
        id: "sec-quiz",
        title: "Quiz Final: Web3 Security",
        type: "quiz",
        duration: "15 min",
        description: "18 preguntas sobre seguridad de wallets, detección de scams, approvals, rug pulls y OpSec. Necesitas 80% para aprobar — la seguridad no es negociable. Obtén tu badge Security Expert + recompensas.",
        content_url: null,
        is_free_preview: false,
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
        const existing = await db.select().from(courses).where(eq(courses.id, course.id));
        if (existing.length === 0) {
          const [inserted] = await db.insert(courses).values(course).returning();
          results.push({ id: course.id, action: 'created', data: inserted });
        } else {
          results.push({ id: course.id, action: 'skipped' });
        }
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
