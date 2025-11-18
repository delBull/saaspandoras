import { NextResponse } from 'next/server';
import { updatePreapplyLeadStatus } from '@/lib/whatsapp/preapply-db';

// PATCH /api/admin/whatsapp-preapply/[id]/status - Cambiar status de un lead
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected' },
        { status: 400 }
      );
    }

    const leadId = parseInt(id);
    if (isNaN(leadId)) {
      return NextResponse.json(
        { error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    const success = await updatePreapplyLeadStatus(leadId, status);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update lead status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leadId,
      newStatus: status,
    });

  } catch (error) {
    console.error('Error en PATCH /api/admin/whatsapp-preapply/[id]/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
