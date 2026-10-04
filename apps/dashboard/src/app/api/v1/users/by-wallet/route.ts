import { db } from "@saasfly/db-core";
import { users } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
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
