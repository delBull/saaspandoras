import { db } from "./src/db";
import { courses } from "./src/db/schema";
import { eq } from "drizzle-orm";

const REAL_SEED_COURSES = [
  {
    id: "defi-basics",
    title: "Fundamentos de DeFi",
    description: "Aprende los conceptos esenciales de las Finanzas Descentralizadas (DeFi): desde qué es una blockchain hasta cómo usar protocolos de lending, liquidity pools y yield farming de forma segura.",
    category: "DeFi",
    difficulty: "beginner" as const,
    duration: "2 horas 30 min",
    xpReward: 100,
    creditsReward: 10,
    instructor: "Pandora's Education Team",
    prerequisites: [],
    skillsCovered: ["Blockchain Basics", "Wallets & Keys", "DEX Trading", "Lending & Borrowing"],
    orderIndex: 0,
    isActive: true,
    modules: [
      { id: "m1", title: "Módulo 1: ¿Qué es DeFi?", type: "video", duration: "12 min" },
      { id: "m2", title: "Módulo 2: Wallets & Claves Privadas", type: "article", duration: "15 min" }
    ],
  },
  {
    id: "nft-strategies",
    title: "Estrategias NFTs Avanzadas",
    description: "Domina el ecosistema NFT desde la teoría hasta la práctica profesional. Aprende a evaluar colecciones y entender la tecnología.",
    category: "NFTs",
    difficulty: "advanced" as const,
    duration: "4 horas",
    xpReward: 150,
    creditsReward: 15,
    instructor: "NFT & Metaverse Specialist",
    prerequisites: ["defi-basics"],
    skillsCovered: ["ERC-721 & ERC-1155", "NFT Valuation", "Collection Analysis"],
    orderIndex: 1,
    isActive: true,
    modules: [],
  },
  {
    id: "web3-security",
    title: "Seguridad Web3 Essentials",
    description: "Protege tus activos digitales con las mejores prácticas de seguridad en Web3. Aprende a identificar phishing y rug pulls.",
    category: "Security",
    difficulty: "intermediate" as const,
    duration: "3 horas",
    xpReward: 125,
    creditsReward: 12,
    instructor: "Web3 Security Specialist",
    prerequisites: ["defi-basics"],
    skillsCovered: ["Wallet Security", "Hardware Wallets", "Phishing Detection"],
    orderIndex: 2,
    isActive: true,
    modules: [],
  }
];

async function seed() {
  console.log("Seeding REAL courses into DB...");
  
  for (const course of REAL_SEED_COURSES) {
    await db.insert(courses)
      .values(course)
      .onConflictDoUpdate({
        target: courses.id,
        set: { ...course, updatedAt: new Date() }
      });
  }

  console.log("✅ REAL Courses seeded successfully.");
}

seed().catch(console.error);
