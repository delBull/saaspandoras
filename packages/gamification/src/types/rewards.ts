// Rewards and Unlockables system types
export interface Reward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  value: number; // Monetary value or quantity
  icon: string;
  rarity: RewardRarity;

  // Requirements
  requiredLevel: number;
  requiredPoints: number;
  requiredAchievements?: string[]; // Achievement IDs required

  // Availability
  isActive: boolean;
  isLimited: boolean;
  maxClaims?: number;
  totalClaims: number;

  // Metadata
  tags: string[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  status: RewardStatus;
  claimedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface UserUnlockable {
  id: string;
  userId: string;
  unlockableId: string;
  unlockableType: UnlockableType;
  isUnlocked: boolean;
  unlockedAt?: Date;
  metadata?: Record<string, any>;
}

export enum RewardType {
  DISCOUNT = 'discount',           // Descuento en fees
  BONUS_POINTS = 'bonus_points',   // Puntos extra
  EXCLUSIVE_ACCESS = 'exclusive_access', // Acceso exclusivo
  BADGE = 'badge',                // Badge especial
  TITLE = 'title',               // Título especial
  FEATURE_UNLOCK = 'feature_unlock', // Desbloqueo de feature
  CRYPTO_REWARD = 'crypto_reward', // Recompensa en crypto
  MERCHANDISE = 'merchandise'     // Merchandise físico/digital
}

export enum RewardRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum RewardStatus {
  AVAILABLE = 'available',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
  USED = 'used'
}

export enum UnlockableType {
  FEATURE = 'feature',
  CONTENT = 'content',
  BADGE = 'badge',
  TITLE = 'title'
}

// Predefined rewards for tokenization platform
export const TOKENIZATION_REWARDS: Reward[] = [
  // Level-based rewards
  {
    id: 'level_5_discount',
    name: 'Descuento Nivel 5',
    description: '10% de descuento en fees de transacción',
    type: RewardType.DISCOUNT,
    value: 10,
    icon: '💎',
    rarity: RewardRarity.COMMON,
    requiredLevel: 5,
    requiredPoints: 500,
    isActive: true,
    isLimited: false,
    totalClaims: 0,
    tags: ['discount', 'level', 'fees'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'level_10_badge',
    name: 'Badge Inversor Elite',
    description: 'Badge exclusivo para inversores nivel 10+',
    type: RewardType.BADGE,
    value: 0,
    icon: '🏆',
    rarity: RewardRarity.RARE,
    requiredLevel: 10,
    requiredPoints: 1000,
    isActive: true,
    isLimited: false,
    totalClaims: 0,
    tags: ['badge', 'elite', 'investor'],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Achievement-based rewards
  {
    id: 'first_project_bonus',
    name: 'Bono Primer Proyecto',
    description: '100 puntos extra por tu primera aplicación',
    type: RewardType.BONUS_POINTS,
    value: 100,
    icon: '🎯',
    rarity: RewardRarity.COMMON,
    requiredLevel: 1,
    requiredPoints: 0,
    requiredAchievements: ['first_application'],
    isActive: true,
    isLimited: true,
    maxClaims: 1,
    totalClaims: 0,
    tags: ['bonus', 'first', 'achievement'],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Special rewards
  {
    id: 'beta_tester_badge',
    name: 'Beta Tester Legendario',
    description: 'Badge exclusivo para testers beta',
    type: RewardType.BADGE,
    value: 0,
    icon: '⭐',
    rarity: RewardRarity.LEGENDARY,
    requiredLevel: 1,
    requiredPoints: 0,
    requiredAchievements: ['early_adopter'],
    isActive: true,
    isLimited: true,
    maxClaims: 100,
    totalClaims: 0,
    tags: ['beta', 'legendary', 'exclusive'],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Investment-based rewards
  {
    id: 'investor_title',
    name: 'Título de Inversor Premium',
    description: 'Título "Inversor Premium" visible en tu perfil',
    type: RewardType.TITLE,
    value: 0,
    icon: '👑',
    rarity: RewardRarity.RARE,
    requiredLevel: 8,
    requiredPoints: 800,
    isActive: true,
    isLimited: false,
    totalClaims: 0,
    tags: ['title', 'premium', 'investor'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];