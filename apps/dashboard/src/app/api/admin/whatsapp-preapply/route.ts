import { NextResponse } from 'next/server';
import { getAllPreapplyLeads, updatePreapplyLeadStatus } from '@/lib/whatsapp/preapply-db';

// GET /api/admin/whatsapp-preapply - Lista todos los leads de pre-apply
export async function GET() {
  try {
    const leads = await getAllPreapplyLeads();

    return NextResponse.json({
      success: true,
      leads,
      total: leads.length,
      pending: leads.filter(l => l.status === 'pending').length,
      approved: leads.filter(l => l.status === 'approved').length,
      completed: leads.filter(l => l.status === 'completed').length,
    });

  } catch (error) {
    console.error('Error en GET /api/admin/whatsapp-preapply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/whatsapp-preapply/:id/status - Cambiar status de un lead
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected' },
        { status: 400 }
      );
    }

    const leadId = parseInt(params.id);
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
    console.error('Error en PATCH /api/admin/whatsapp-preapply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
