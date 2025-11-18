import { NextResponse } from 'next/server';
import { getAllPreapplyLeads } from '@/lib/whatsapp/preapply-db';

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
