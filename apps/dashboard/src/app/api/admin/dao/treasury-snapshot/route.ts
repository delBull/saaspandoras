import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoTreasurySnapshots, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { defineChain } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { getWalletBalance } from "thirdweb/wallets";

export async function POST(req: Request) {
    try {
        const { projectId } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
        }

        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId)
        });

        if (!project || (!project.treasuryAddress && !(project as any).treasuryContractAddress)) {
            return NextResponse.json({ error: 'Project treasury not configured' }, { status: 404 });
        }

        const treasuryAddress = project.treasuryAddress || (project as any).treasuryContractAddress;
        const chainId = project.chainId || 11155111;

        // Fetch primary balance (Native)
        const balance = await getWalletBalance({
            client,
            chain: defineChain(chainId),
            address: treasuryAddress
        });

        // Insert snapshot
        await db.insert(daoTreasurySnapshots).values({
            projectId,
            token: balance.symbol,
            balance: balance.displayValue,
            usdValue: balance.displayValue, // Metadata for current value
            timestamp: new Date()
        });

        return NextResponse.json({ 
            success: true, 
            message: `Snapshot recorded for ${balance.symbol}: ${balance.displayValue}`,
            data: {
                token: balance.symbol,
                balance: balance.displayValue,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('Error taking treasury snapshot:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
