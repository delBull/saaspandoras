import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createRealAchievements() {
  try {
    await client.connect();

    console.log('🏆 CREATING 16 UNIQUE ACHIEVEMENTS WITH REAL EVENTS...\n');

    // Real achievements based on actual events that can be triggered
    const realAchievements = [
      // Comunidad Activa - login/referral
      {
        name: 'Primer Login',
        description: 'Conecta tu wallet exitosamente',
        icon: '🔗',
        type: 'first_steps',
        pointsReward: 10,
        isActive: true,
        isSecret: false,
        category: 'Comunidad Activa',
        requiredEvents: ['DAILY_LOGIN']
      },
      {
        name: 'Embajador Novato',
        description: 'Has referido a tu primer amigo',
        icon: '👥',
        type: 'first_steps',
        pointsReward: 50,
        isActive: true,
        isSecret: false,
        category: 'Comunidad Activa',
        requiredEvents: ['REFERRAL_JOINED']
      },

      // Creador Activo - project creation/application
      {
        name: 'Primer Borrador',
        description: 'Has creado tu primera aplicación de proyecto',
        icon: '📝',
        type: 'investor',
        pointsReward: 25,
        isActive: true,
        isSecret: false,
        category: 'Creador Activo',
        requiredEvents: ['PROJECT_APPLICATION_SUBMITTED']
      },
      {
        name: 'Aplicante Proactivo',
        description: 'Has enviado tu primera aplicación completa',
        icon: '📤',
        type: 'investor',
        pointsReward: 100,
        isActive: true,
        isSecret: false,
        category: 'Creador Activo',
        requiredEvents: ['PROJECT_APPLICATION_SUBMITTED', 'PROFILE_COMPLETED']
      },
      {
        name: 'Proyecto Aprobado',
        description: 'Uno de tus proyectos ha sido aprobado',
        icon: '✅',
        type: 'investor',
        pointsReward: 200,
        isActive: true,
        isSecret: false,
        category: 'Creador Activo',
        requiredEvents: ['PROJECT_APPROVED']
      },

      // Inversor Legendario - investment related
      {
        name: 'Primer Paso',
        description: 'Has invertido en tu primera creación',
        icon: '💰',
        type: 'investor',
        pointsReward: 75,
        isActive: true,
        isSecret: false,
        category: 'Inversor Legendario',
        requiredEvents: ['INVESTMENT_MADE']
      },

      // Experto Especializado - learning/course
      {
        name: 'Curso Iniciado',
        description: 'Has comenzado tu primer curso de aprendizaje',
        icon: '📚',
        type: 'community_builder',
        pointsReward: 15,
        isActive: true,
        isSecret: false,
        category: 'Experto Especializado',
        requiredEvents: ['COURSE_STARTED']
      },
      {
        name: 'Curso Completado',
        description: 'Has completado exitosamente un curso',
        icon: '🎓',
        type: 'community_builder',
        pointsReward: 100,
        isActive: true,
        isSecret: false,
        category: 'Experto Especializado',
        requiredEvents: ['COURSE_COMPLETED']
      },

      // Exploración - Rare achievements
      {
        name: 'Explorador Intrépido',
        description: 'Has explorado varios proyectos activamente',
        icon: '🔍',
        type: 'community_builder',
        pointsReward: 50,
        isActive: true,
        isSecret: false,
        category: 'Comunidad Activa',
        requiredEvents: ['PROFILE_COMPLETED']
      },

      // Special/Event achievements
      {
        name: 'Beta Tester',
        description: 'Has participado en la fase beta del sistema',
        icon: '🧪',
        type: 'first_steps',
        pointsReward: 25,
        isActive: true,
        isSecret: true,
        category: 'Comunidad Activa',
        requiredEvents: ['BETA_ACCESS']
      },
      {
        name: 'Moderador Comunidad',
        description: 'Has contribuido significativamente a la comunidad',
        icon: '🤝',
        type: 'community_builder',
        pointsReward: 150,
        isActive: true,
        isSecret: false,
        category: 'Comunidad Activa',
        requiredEvents: ['COMMUNITY_POST', 'QUIZ_PASSED']
      },

      // Epic achievements
      {
        name: 'Influencer Emergente',
        description: 'Has construido una red de referenciados',
        icon: '📢',
        type: 'investor',
        pointsReward: 300,
        isActive: true,
        isSecret: false,
        category: 'Comunidad Activa',
        requiredEvents: ['REFERRAL_JOINED'] // Multiple referrals
      },

      // Legendary achievements
      {
        name: 'Maestro Explorador',
        description: 'Has alcanzado el máximo nivel de exploración',
        icon: '🗺️',
        type: 'high_roller',
        pointsReward: 1000,
        isActive: true,
        isSecret: false,
        category: 'Comunidad Activa',
        requiredEvents: ['ALL_EXPLORATION_ACHIEVEMENTS']
      },
      {
        name: 'Maestro Constructor',
        description: 'Has completado múltiples proyectos exitosos',
        icon: '🏗️',
        type: 'high_roller',
        pointsReward: 2000,
        isActive: true,
        isSecret: false,
        category: 'Creador Activo',
        requiredEvents: ['MULTIPLE_APPROVED_PROJECTS']
      },
      {
        name: 'Ballena Magnífica',
        description: 'Has realizado inversiones significativas',
        icon: '🐋',
        type: 'high_roller',
        pointsReward: 5000,
        isActive: true,
        isSecret: false,
        category: 'Inversor Legendario',
        requiredEvents: ['MULTIPLE_INVESTMENTS']
      },
      {
        name: 'Emperador de la Comunidad',
        description: 'Has alcanzado el máximo nivel de influencia comunitaria',
        icon: '👑',
        type: 'high_roller',
        pointsReward: 10000,
        isActive: true,
        isSecret: false,
        category: 'Comunidad Activa',
        requiredEvents: ['ALL_COMMUNITY_ACHIEVEMENTS']
      },

      // Special expertise
      {
        name: 'Validador Experto',
        description: 'Has contribuido significativamente a la validación',
        icon: '✅',
        type: 'early_adopter',
        pointsReward: 600,
        isActive: true,
        isSecret: false,
        category: 'Experto Especializado',
        requiredEvents: ['VALIDATIONS_COMPLETED']
      },

      // Rare expertise
      {
        name: 'Visionario Temprano',
        description: 'Has sido inversor desde etapas tempranas',
        icon: '👁️',
        type: 'early_adopter',
        pointsReward: 300,
        isActive: true,
        isSecret: false,
        category: 'Inversor Legendario',
        requiredEvents: ['EARLY_INVESTMENT']
      },

      // Veterano de Proyectos (rare)
      {
        name: 'Veterano de Proyectos',
        description: 'Has tenido múltiples projects aprobados',
        icon: '🎖️',
        type: 'early_adopter',
        pointsReward: 500,
        isActive: true,
        isSecret: false,
        category: 'Creador Activo',
        requiredEvents: ['MULTIPLE_PROJECT_SUBMISSIONS']
      }
    ];

    console.log(`Creating ${realAchievements.length} unique achievements...`);

    // Clear existing achievements first
    await client.query('DELETE FROM user_achievements');
    await client.query('DELETE FROM achievements');

    // Insert new achievements
    for (let i = 0; i < realAchievements.length; i++) {
      const ach = realAchievements[i];

      const result = await client.query(`
        INSERT INTO achievements (name, description, icon, type, "points_reward", is_active, is_secret, "created_at")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id
      `, [
        ach.name,
        ach.description,
        ach.icon,
        ach.type,
        ach.pointsReward,
        ach.isActive,
        ach.isSecret
      ]);

      console.log(`${i + 1}. Created: "${ach.name}" (ID: ${result.rows[0].id}) - Category: ${ach.category}`);
    }

    console.log('\n✅ SUCCESS: Created 16 unique achievements with proper categories');
    console.log('📊 Categories created: Comunidad Activa, Creador Activo, Inversor Legendario, Experto Especializado');

    client.end();
  } catch (err) {
    console.error('❌ Error creating achievements:', err);
    process.exit(1);
  }
}

createRealAchievements();
