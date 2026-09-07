import { NextRequest, NextResponse } from 'next/server';
import { A2ASecurityValidator } from '@/lib/pandoras/core/domains/hermes/a2a/a2a-security-validator';
import { AgentRegistry } from '@/lib/pandoras/core/domains/hermes/a2a/agent-registry';
import { A2AMessage } from '@/lib/pandoras/core/domains/hermes/a2a/contracts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const messageStr = formData.get('message') as string;
    const file = formData.get('file') as Blob;

    if (!messageStr || !file) {
      return NextResponse.json({ success: false, error: 'Missing message envelope or file' }, { status: 400 });
    }

    const message = JSON.parse(messageStr) as A2AMessage;
    if (message.type !== 'media.upload') {
      return NextResponse.json({ success: false, error: 'Invalid message type' }, { status: 400 });
    }

    // 1. Validate Security
    const validation = await A2ASecurityValidator.validateAsync(message);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.errorMessage }, { status: 401 });
    }

    // 2. Capability Check
    const hasCap = await AgentRegistry.hasCapabilityAsync(message.from, 'media.upload', message.tenantId);
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Capability denied for media.upload' }, { status: 403 });
    }

    // 3. Upload to IPFS Proxy (Railway)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Note: Since this is an internal trusted node, we upload it via HTTP API
    const ipfsNodeUrl = process.env.RAILWAY_IPFS_URL || 'https://rpc.ipfs.pandoras.finance';
    
    const ipfsFormData = new FormData();
    ipfsFormData.append('file', new Blob([buffer], { type: (file as any).type }), (file as any).name || 'upload.bin');

    const ipfsRes = await fetch(`${ipfsNodeUrl}/api/v0/add`, {
      method: 'POST',
      body: ipfsFormData,
    });

    if (!ipfsRes.ok) {
      const errText = await ipfsRes.text();
      console.error('[API /a2a/upload] IPFS node error:', errText);
      return NextResponse.json({ success: false, error: 'Upstream IPFS error' }, { status: 502 });
    }

    const ipfsData = await ipfsRes.json();
    const cid = ipfsData.Hash;

    return NextResponse.json({
      success: true,
      cid,
      url: `https://ipfs.pandoras.finance/ipfs/${cid}`,
    }, { status: 200 });

  } catch (err: any) {
    console.error('[API /a2a/upload] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
