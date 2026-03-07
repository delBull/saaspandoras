import { db } from './src/db';
import { sql } from 'drizzle-orm';

// All achievements to seed
const ACHIEVEMENTS_CATALOG = [
    {
        name: 'Primer Login',
        description: 'Inicia sesión por primera vez en Pandoras',
        icon: '🎉',
        type: 'first_steps',
        points_reward: 10,
    },
    {
        name: 'Primer Paso',
        description: 'Envía tu primera aplicación de protocolo',
        icon: '🚀',
        type: 'creator',
        points_reward: 50,
    },
    {
        name: 'Entusiasta de Protocolos',
        description: 'Aplica a 5 protocolos diferentes',
        icon: '📈',
        type: 'creator',
        points_reward: 200,
    },
    {
        name: 'Campeón de Protocolos',
        description: 'Aplica a 10 protocolos',
        icon: '🏆',
        type: 'creator',
        points_reward: 500,
    },
    {
        name: 'Primer Inversor',
        description: 'Realiza tu primera participación en un protocolo',
        icon: '💰',
        type: 'investor',
        points_reward: 100,
    },
    {
        name: 'Participativo',
        description: 'Participa en 5 protocolos diferentes',
        icon: '🎯',
        type: 'investor',
        points_reward: 300,
    },
    {
        name: 'Constructor de Comunidad',
        description: 'Refiere a 3 nuevos usuarios a Pandoras',
        icon: '👥',
        type: 'community_builder',
        points_reward: 250,
    },
    {
        name: 'Buscador de Conocimiento',
        description: 'Completa 3 módulos educativos',
        icon: '📚',
        type: 'tokenization_expert',
        points_reward: 200,
    },
    {
        name: 'Guerrero de la Semana',
        description: 'Mantén una racha de 7 días consecutivos',
        icon: '🔥',
        type: 'community_builder',
        points_reward: 150,
    },
    {
        name: 'Maestro del Mes',
        description: 'Mantén una racha de 30 días consecutivos',
        icon: '👑',
        type: 'early_adopter',
        points_reward: 400,
    },
    {
        name: 'Adoptador Temprano',
        description: 'Únete durante la fase beta de Pandoras',
        icon: '⭐',
        type: 'early_adopter',
        points_reward: 1000,
    },
    {
        name: 'High Roller',
        description: 'Acumula más de 1000 puntos de reputación',
        icon: '💎',
        type: 'high_roller',
        points_reward: 500,
    },
    {
        name: 'Pionero del DAO',
        description: 'Participa en tu primera votación de gobernanza',
        icon: '🗳️',
        type: 'dao_pioneer',
        points_reward: 300,
    },
];

async function main() {
    console.log('🌱 Seeding achievements catalog...');

    for (const achievement of ACHIEVEMENTS_CATALOG) {
        // Check if exists
        const existing = await db.execute(
            sql`SELECT id FROM achievements WHERE name = ${achievement.name} LIMIT 1`
        );
        if (existing.length > 0) {
            console.log(`  ✅ Already exists: ${achievement.name}`);
            continue;
        }

        // Insert
        await db.execute(sql`
      INSERT INTO achievements (name, description, icon, type, points_reward, created_at)
      VALUES (
        ${achievement.name},
        ${achievement.description},
        ${achievement.icon},
        ${achievement.type},
        ${achievement.points_reward},
        NOW()
      )
    `);
        console.log(`  🌱 Seeded: ${achievement.name} (${achievement.points_reward} pts)`);
    }

    const total = await db.execute(sql`SELECT COUNT(*) as count FROM achievements`);
    console.log(`\n✅ Done! Total achievements in DB: ${(total[0] as any).count}`);

    process.exit(0);
}
main().catch(console.error);
