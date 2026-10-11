import { redirect } from 'next/navigation';
import { db, eq } from '@saasfly/db-core';
import { commercialOrders } from '@saasfly/db-core/schema';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import CheckoutClient from './CheckoutClient';

export default async function CheckoutPage({ params }: { params: { orderId: string } }) {
  const { orderId } = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('commercial_session')?.value;

  if (!sessionToken) {
    redirect('/'); // Default redirect if no commercial session
  }

  let payload;
  try {
    if (!process.env.PANDORAS_SECRET_KEY) {
      throw new Error('PANDORAS_SECRET_KEY is missing');
    }
    const secret = new TextEncoder().encode(process.env.PANDORAS_SECRET_KEY);
    const result = await jose.jwtVerify(sessionToken, secret);
    payload = result.payload;
  } catch (error) {
    redirect('/');
  }

  if (!payload.scope || typeof payload.scope !== 'string' || !payload.scope.includes('commercial:lead_read') || !payload.leadId) {
    redirect('/');
  }

  const [order] = await db
    .select()
    .from(commercialOrders)
    .where(eq(commercialOrders.id, orderId))
    .limit(1);

  if (!order) {
    return <div className="p-8 text-white">Order not found</div>;
  }

  if (order.leadId !== payload.leadId) {
    redirect('/'); // IDOR protection
  }

  return <CheckoutClient order={order} />;
}
