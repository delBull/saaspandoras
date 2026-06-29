import { db } from "~/db";
import { projects, users } from "~/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [project] = await db.select({ applicantWalletAddress: projects.applicantWalletAddress })
    .from(projects)
    .where(eq(projects.slug, slug));

  if (!project || !project.applicantWalletAddress) {
    return NextResponse.json({ error: 'no project or wallet' }, { status: 404 });
  }

  const [user] = await db.select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.walletAddress, project.applicantWalletAddress.toLowerCase()));

  if (!user) {
    // Fallback: use founders alias resolver
    return NextResponse.json({ userId: 'founders', name: 'Equipo' });
  }

  return NextResponse.json({ userId: user.id, name: user.name || 'Fundador' });
}
