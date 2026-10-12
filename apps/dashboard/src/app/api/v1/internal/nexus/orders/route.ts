import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db-core';
import { commercialOrders, commercialOrderLines, privatePaymentLinks } from '@saasfly/db-core/schema';
import * as jose from 'jose';
import * as crypto from 'crypto';
import { cookies } from 'next/headers';

import { PRODUCT_REGISTRY } from '@saasfly/shared';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('commercial_session')?.value;
    
    if (!sessionToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    if (!process.env.PANDORAS_SECRET_KEY) {
      return new NextResponse('Internal Server Error: Missing Secret', { status: 500 });
    }
    const secret = new TextEncoder().encode(process.env.PANDORAS_SECRET_KEY);
    const { payload } = await jose.jwtVerify(sessionToken, secret);
    
    if (!payload.scope || typeof payload.scope !== 'string' || !payload.scope.includes('commercial:order_create') || !payload.leadId) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    const leadId = payload.leadId as string;
    
    const body = await req.json();
    const { requestedOrgName, requestedOrgSlug, products } = body;
    
    if (!requestedOrgName || !requestedOrgSlug || !Array.isArray(products) || products.length === 0) {
      return new NextResponse('Invalid payload', { status: 400 });
    }
    
    // Calculate total and validate products against server catalog
    let totalAmount = 0;
    const validatedLines: { productKey: string; priceVersion: string; unitPrice: string; metadata: any }[] = [];
    
    const processedRegistryKeys = new Set<string>();
    
    for (const p of products) {
      let catalogItem: any = null;
      let registryKey = '';
      
      if (p.productKey === 'PANDORAS_RWA') { catalogItem = PRODUCT_REGISTRY.TOKENIZATION; registryKey = 'TOKENIZATION'; }
      else if (p.productKey === 'GROWTH_OS') { catalogItem = PRODUCT_REGISTRY.HERMES; registryKey = 'HERMES'; }
      else if (p.productKey === 'HERMES') { catalogItem = PRODUCT_REGISTRY.HERMES; registryKey = 'HERMES'; }

      if (!catalogItem) {
        return new NextResponse(`Invalid product: ${p.productKey}`, { status: 400 });
      }
      
      if (processedRegistryKeys.has(registryKey)) {
        continue; // deduplicate
      }
      processedRegistryKeys.add(registryKey);
      
      const plan = p.metadata?.plan || 'starter';
      const priceObj = catalogItem.pricing[plan] || catalogItem.pricing.starter;
      if (!priceObj || typeof priceObj.price !== 'number' || priceObj.price <= 0) {
        return new NextResponse(`Pricing unavailable or invalid for product: ${p.productKey}`, { status: 400 });
      }
      const price = priceObj.price;
      
      totalAmount += price;
      validatedLines.push({
        productKey: p.productKey,
        priceVersion: `v3_${plan}`,
        unitPrice: price.toString(),
        metadata: p.metadata || {}
      });
    }
    
    const idempotencyKey = body.idempotencyKey || crypto.randomUUID();
    
    const PANDORAS_TREASURY_WALLET = process.env.NEXT_PUBLIC_PANDORAS_TREASURY_WALLET || "0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9";
    const networkChainId = process.env.NODE_ENV === "production" ? 8453 : 11155111;

    const result = await db.transaction(async (tx) => {
       const [order] = await tx.insert(commercialOrders).values({
         leadId,
         currency: 'USD',
         totalAmount: totalAmount.toString(),
         status: 'PENDING_PAYMENT',
         requestedOrgName,
         requestedOrgSlug,
         idempotencyKey
       })
       .onConflictDoNothing({ target: commercialOrders.idempotencyKey })
       .returning({ id: commercialOrders.id });
       
       if (!order) {
         return null;
       }
       
       for (const line of validatedLines) {
         await tx.insert(commercialOrderLines).values({
           orderId: order.id,
           productKey: line.productKey,
           priceVersion: line.priceVersion,
           unitPrice: line.unitPrice,
           metadata: line.metadata
         });
       }

       // Create associated privatePaymentLinks intent for On-Chain / Wire settlement
       // 🛡️ Vertical derivado del/los products de la ORDEN (no del cliente):
       const orderVertical = validatedLines.some(l => l.productKey === 'HERMES')
         ? 'HERMES_OS'
         : validatedLines.some(l => ['TOKENIZATION', 'MEDIA_CO', 'NFT_LAB'].includes(l.productKey))
           ? 'RWA'
           : 'GROWTH_OS';

       const [intent] = await tx.insert(privatePaymentLinks).values({
         title: `Workspace Activation: ${requestedOrgName}`,
         description: `Commercial order ${order.id} for organization ${requestedOrgSlug}`,
         amount: totalAmount.toString(),
         currency: 'USD',
         destinationWallet: PANDORAS_TREASURY_WALLET.toLowerCase(),
         networkChainId,
         status: 'active',
         metadata: {
           orderId: order.id,
           leadId,
           requestedOrgSlug,
           requestedOrgName,
           context: 'CommercialOrder',
           vertical: orderVertical,
           productId: 'COMMERCIAL_ORDER'
         }
       }).returning({ id: privatePaymentLinks.id });
       
       return { ...order, intentId: intent?.id };
    });
    
    if (!result) {
       return new NextResponse('Idempotent request already processed', { status: 409 });
    }

    // 🛰️ Publish OrderCreated to Hermes Event Bus (Batch D)
    try {
      const { HermesEventBus } = await import('@saasfly/hermes-core');
      await HermesEventBus.emit('OrderCreated', 0, 'pandoras_commerce', {
        orderId: result.id,
        leadId,
        requestedOrgSlug,
        requestedOrgName,
        vertical: (typeof result as any)?.vertical || null,
        totalAmount,
      });
    } catch (busErr) {
      console.error('[Orders] HermesEventBus publish failed (non-blocking):', busErr);
    }
    
    try {
      const { sendBusinessNotification } = await import('@/lib/discord/business-notifier');
      await sendBusinessNotification('New Commercial Order (B2B)', {
        leadId,
        organization: requestedOrgName,
        slug: requestedOrgSlug,
        totalAmount: `${totalAmount} USD`
      }, 'info');
    } catch (e) {
      console.warn('Non-blocking: Failed to send discord alert for order', e);
    }
    
    return NextResponse.json({ success: true, orderId: result.id, intentId: result.intentId, status: 'PENDING_PAYMENT' });
    
  } catch (error: any) {
    console.error('[Commercial Hub] Order creation error:', error);
    if (error.code === '23505' && error.constraint === 'commercial_orders_active_idx') {
       return new NextResponse('Lead already has an active order', { status: 409 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}
