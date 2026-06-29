import { db } from "~/db";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });

    const [user] = await db.select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.walletAddress, address.toLowerCase()));

    if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });

    return NextResponse.json(user);
}
