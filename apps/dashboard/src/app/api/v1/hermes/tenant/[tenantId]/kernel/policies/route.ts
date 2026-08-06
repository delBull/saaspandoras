import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    return NextResponse.json({
        priorityMatrix: [
            { level: 'HIGH', category: 'Security' },
            { level: 'MEDIUM', category: 'Compliance' },
            { level: 'LOW', category: 'Conversation' }
        ],
        conflictResolutions: [
            { conflict: 'Security vs Conversation', winner: 'Security' }
        ],
        activeRules: [
            'Deny execution if risk_score > 0.8',
            'Enforce rate limit of 10 msgs / min'
        ]
    });
}
