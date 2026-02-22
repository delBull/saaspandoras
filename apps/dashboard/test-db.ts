import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log("Projects Count:");
    const projects = await db.execute(sql`SELECT id, title, business_category, status FROM projects`);
    console.log(projects);

    console.log("\nUsers Count:");
    const users = await db.execute(sql`SELECT id, name, "walletAddress", "connectionCount", "lastConnectionAt" FROM users`);
    console.log(users);

    process.exit(0);
}
main();
