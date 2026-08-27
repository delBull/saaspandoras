import { NextRequest, NextResponse } from 'next/server';
import { EnvelopeService } from '@/lib/deal-signing/envelope-service';
import { EvidencePackager } from '@/lib/deal-signing/evidence-packager';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/deal-signing/envelopes/[envelopeId]/evidence
 * Returns the assembled Evidence Package v1 payload
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ envelopeId: string }> }
) {
  try {
    const { envelopeId } = await params;
    const envelope = await EnvelopeService.getEnvelope(envelopeId);

    if (!envelope) {
      return NextResponse.json(
        { success: false, error: 'ENVELOPE_NOT_FOUND', message: `Envelope '${envelopeId}' does not exist.` },
        { status: 404 }
      );
    }

    const auditTrail = [
      { at: envelope.createdAt, actor: 'SYSTEM', action: 'EnvelopeCreated' },
      ...envelope.signers
        .filter(s => s.signatureProof)
        .map(s => ({
          at: s.signatureProof!.signedAt,
          actor: s.email,
          action: 'DocumentSigned',
          ip: s.authentication?.ipAddress,
          detail: `Signer ${s.name} (${s.signatureProof!.signerAddress}) signed via EIP-712`,
        })),
      ...(envelope.completedAt ? [{ at: envelope.completedAt, actor: 'SYSTEM', action: 'EnvelopeCompleted' }] : []),
    ];

    const evidencePkg = EvidencePackager.assemble(envelope, auditTrail);

    return NextResponse.json({
      success: true,
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      isCompleted: envelope.status === 'COMPLETED',
      evidence: evidencePkg,
    });
  } catch (error: any) {
    console.error('[DealSigning API] Error assembling evidence:', error);
    return NextResponse.json(
      { success: false, error: 'EVIDENCE_ASSEMBLY_FAILED', message: error?.message || 'Failed to assemble evidence' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/deal-signing/envelopes/[envelopeId]/evidence
 * Attaches on-chain blockchain anchoring proof (Option B: User / Sponsor manual anchor)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ envelopeId: string }> }
) {
  try {
    const { envelopeId } = await params;
    const body = await req.json();

    const {
      chainId,
      contractAddress,
      transactionHash,
      blockNumber,
      blockTimestamp,
      registryEventIndex,
      rootEvidenceHash,
    } = body;

    if (!transactionHash || !contractAddress || !chainId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSING_EVIDENCE_PARAMS', 
          message: 'Fields [transactionHash], [contractAddress], and [chainId] are mandatory.' 
        },
        { status: 400 }
      );
    }

    const updatedEnvelope = await EnvelopeService.attachBlockchainEvidence(envelopeId, {
      chainId: Number(chainId),
      contractAddress: contractAddress.toLowerCase(),
      transactionHash: transactionHash.toLowerCase(),
      blockNumber: Number(blockNumber || 0),
      blockTimestamp: Number(blockTimestamp || Math.floor(Date.now() / 1000)),
      registryEventIndex: Number(registryEventIndex || 0),
      rootEvidenceHash: rootEvidenceHash || '',
    });

    return NextResponse.json({
      success: true,
      envelope: updatedEnvelope,
      blockchainEvidence: updatedEnvelope.blockchainEvidence,
    });

  } catch (error: any) {
    console.error('[DealSigning API] Error attaching blockchain evidence:', error);
    return NextResponse.json(
      { success: false, error: 'ATTACH_EVIDENCE_FAILED', message: error?.message || 'Failed to attach blockchain evidence' },
      { status: 500 }
    );
  }
}
