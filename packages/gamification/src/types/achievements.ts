// Achievement and Badge system types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;

  // Requirements
  requirements: AchievementRequirement[];
  isActive: boolean;
  isSecret: boolean; // Hidden until unlocked

  // Metadata
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number; // 0-100 percentage
  isCompleted: boolean;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AchievementRequirement {
  type: RequirementType;
  target: number;
  current?: number;
  metadata?: Record<string, any>;
}

export enum AchievementCategory {
  PROJECTS = 'projects',
  INVESTMENTS = 'investments',
  COMMUNITY = 'community',
  LEARNING = 'learning',
  SPECIAL = 'special',
  STREAKS = 'streaks',
  SOCIAL = 'social'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum RequirementType {
  PROJECTS_APPLIED = 'projects_applied',
  PROJECTS_APPROVED = 'projects_approved',
  TOTAL_INVESTED = 'total_invested',
  COMMUNITY_POSTS = 'community_posts',
  REFERRALS_MADE = 'referrals_made',
  COURSES_COMPLETED = 'courses_completed',
  DAILY_STREAK = 'daily_streak',
  TOTAL_POINTS = 'total_points',
  PROJECTS_FUNDED = 'projects_funded',
  SOCIAL_SHARES = 'social_shares',
  SPECIAL_EVENT = 'special_event'
}

// Predefined achievements for tokenization platform
export const TOKENIZATION_ACHIEVEMENTS: Achievement[] = [
  // Project Application Achievements
  {
    id: 'first_application',
    name: 'Primer Paso',
    description: 'Envía tu primera aplicación de proyecto',
    icon: '🚀',
    category: AchievementCategory.PROJECTS,
    rarity: AchievementRarity.COMMON,
    points: 50,
    requirements: [
      { type: RequirementType.PROJECTS_APPLIED, target: 1 }
    ],
    isActive: true,
    isSecret: false,
    tags: ['application', 'beginner'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'project_enthusiast',
    name: 'Entusiasta de Creaciones',
    description: 'Aplica a 5 creaciones',
    icon: '📈',
    category: AchievementCategory.PROJECTS,
    rarity: AchievementRarity.UNCOMMON,
    points: 200,
    requirements: [
      { type: RequirementType.PROJECTS_APPLIED, target: 5 }
    ],
    isActive: true,
    isSecret: false,
    tags: ['application', 'active'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'project_champion',
    name: 'Campeón de Creaciones',
    description: 'Aplica a 10 creaciones',
    icon: '🏆',
    category: AchievementCategory.PROJECTS,
    rarity: AchievementRarity.RARE,
    points: 500,
    requirements: [
      { type: RequirementType.PROJECTS_APPLIED, target: 10 }
    ],
    isActive: true,
    isSecret: false,
    tags: ['application', 'champion'],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Investment Achievements
  {
    id: 'first_investment',
    name: 'Primer Inversor',
    description: 'Realiza tu primera inversión',
    icon: '💰',
    category: AchievementCategory.INVESTMENTS,
    rarity: AchievementRarity.COMMON,
    points: 100,
    requirements: [
      { type: RequirementType.TOTAL_INVESTED, target: 1 }
    ],
    isActive: true,
    isSecret: false,
    tags: ['investment', 'beginner'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'investor',
    name: 'Inversor Activo',
    description: 'Invierte en 5 creaciones diferentes',
    icon: '🎯',
    category: AchievementCategory.INVESTMENTS,
    rarity: AchievementRarity.UNCOMMON,
    points: 300,
    requirements: [
      { type: RequirementType.PROJECTS_FUNDED, target: 5 }
    ],
    isActive: true,
    isSecret: false,
    tags: ['investment', 'diversification'],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Community Achievements
  {
    id: 'community_builder',
    name: 'Constructor de Comunidad',
    description: 'Refiere a 3 nuevos usuarios',
    icon: '👥',
    category: AchievementCategory.COMMUNITY,
    rarity: AchievementRarity.UNCOMMON,
    points: 250,
    requirements: [
      { type: RequirementType.REFERRALS_MADE, target: 3 }
    ],
    isActive: true,
    isSecret: false,
    tags: ['community', 'referral'],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Learning Achievements
  {
    id: 'knowledge_seeker',
    name: 'Buscador de Conocimiento',
    description: 'Completa 3 cursos educativos',
    icon: '📚',
    category: AchievementCategory.LEARNING,
    rarity: AchievementRarity.UNCOMMON,
    points: 200,
    requirements: [
      { type: RequirementType.COURSES_COMPLETED, target: 3 }
    ],
    isActive: true,
    isSecret: false,
    tags: ['education', 'learning'],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Streak Achievements
  {
    id: 'week_warrior',
    name: 'Guerrero de la Semana',
    description: 'Mantén una racha de 7 días',
    icon: '🔥',
    category: AchievementCategory.STREAKS,
    rarity: AchievementRarity.UNCOMMON,
    points: 150,
    requirements: [
      { type: RequirementType.DAILY_STREAK, target: 7 }
    ],
    isActive: true,
    isSecret: false,
    tags: ['streak', 'consistency'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'month_master',
    name: 'Maestro del Mes',
    description: 'Mantén una racha de 30 días',
    icon: '👑',
    category: AchievementCategory.STREAKS,
    rarity: AchievementRarity.RARE,
    points: 400,
    requirements: [
      { type: RequirementType.DAILY_STREAK, target: 30 }
    ],
    isActive: true,
    isSecret: false,
    tags: ['streak', 'dedication'],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Special Achievements
  {
    id: 'early_adopter',
    name: 'Adoptador Temprano',
    description: 'Únete durante la fase beta',
    icon: '⭐',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    points: 1000,
    requirements: [
      { type: RequirementType.SPECIAL_EVENT, target: 1, metadata: { event: 'beta_launch' } }
    ],
    isActive: true,
    isSecret: true,
    tags: ['special', 'beta'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];