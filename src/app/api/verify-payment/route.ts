import { NextResponse } from 'next/server';
import { getActiveUserId, ensureUserWorkspaceSeeded } from '@/app/actions';
import { hashPlayPurchaseToken, getAllowedPlayProductIds, verifyAndAcknowledgePlayPurchase } from '@/lib/google-play';
import { FORGE_PRO_CURRENCY, FORGE_PRO_PRICE_PAISE, getRazorpayClient, verifySignature } from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function activatePro(userId: string) {
  await ensureUserWorkspaceSeeded(userId);
  const updateResult = await prisma.identityVector.updateMany({
    where: { userId },
    data: { isPro: true },
  });

  if (updateResult.count === 0) {
    await prisma.identityVector.create({
      data: {
        userId,
        title: 'Algorithms Specialist',
        lifesTaskStatement: 'Master algorithmic problem solving and system architecture.',
        currentPhase: 'OBSERVATION',
        isPro: true,
      },
    });
  }
}

async function claimPlayPurchase(userId: string, productId: string, tokenHash: string, orderId?: string) {
  const existing = await prisma.playPurchase.findUnique({ where: { tokenHash } });
  if (existing && existing.userId !== userId) return false;
  if (!existing) {
    try {
      await prisma.playPurchase.create({
        data: { tokenHash, userId, productId, orderId: orderId || null },
      });
    } catch {
      // A parallel request may have claimed the same token after the lookup.
      const racedPurchase = await prisma.playPurchase.findUnique({ where: { tokenHash } });
      if (!racedPurchase || racedPurchase.userId !== userId) return false;
    }
  }
  return true;
}

async function claimRazorpayPayment(userId: string, paymentId: string, orderId: string) {
  const existing = await prisma.razorpayPayment.findUnique({ where: { paymentId } });
  if (existing) return existing.userId === userId && existing.orderId === orderId;
  try {
    await prisma.razorpayPayment.create({ data: { paymentId, userId, orderId } });
    return true;
  } catch {
    const racedPayment = await prisma.razorpayPayment.findUnique({ where: { paymentId } });
    return Boolean(racedPayment && racedPayment.userId === userId && racedPayment.orderId === orderId);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const userId = await getActiveUserId();

    if (body.source === 'google_play') {
      const purchaseToken = typeof body.purchaseToken === 'string' ? body.purchaseToken : '';
      const productId = typeof body.productId === 'string' ? body.productId : '';
      if (!purchaseToken || purchaseToken.length > 4096 || !getAllowedPlayProductIds().includes(productId)) {
        return NextResponse.json({ success: false, error: 'Invalid Google Play purchase details.' }, { status: 400 });
      }

      const purchase = await verifyAndAcknowledgePlayPurchase(purchaseToken, productId);
      if (!purchase) {
        return NextResponse.json({ success: false, error: 'Google Play could not verify this purchase.' }, { status: 400 });
      }

      const claimed = await claimPlayPurchase(
        userId,
        productId,
        hashPlayPurchaseToken(purchaseToken),
        purchase.orderId,
      );
      if (!claimed) {
        return NextResponse.json({ success: false, error: 'This purchase is already linked to another account.' }, { status: 409 });
      }

      await activatePro(userId);
      revalidatePath('/');
      return NextResponse.json({ success: true, source: 'google_play' });
    }

    if (body.source !== undefined && body.source !== 'razorpay') {
      return NextResponse.json({ success: false, error: 'Unsupported payment source.' }, { status: 400 });
    }

    const orderId = body.razorpay_order_id ?? body.order_id;
    const paymentId = body.razorpay_payment_id ?? body.payment_id;
    const signature = body.razorpay_signature ?? body.signature;
    if (
      typeof orderId !== 'string' ||
      typeof paymentId !== 'string' ||
      typeof signature !== 'string' ||
      !orderId || !paymentId || !signature
    ) {
      return NextResponse.json({ success: false, error: 'Missing payment verification details.' }, { status: 400 });
    }

    if (!verifySignature({ orderId, paymentId, signature })) {
      return NextResponse.json({ success: false, error: 'Payment signature validation failed.' }, { status: 400 });
    }

    const razorpay = getRazorpayClient();
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(orderId),
      razorpay.payments.fetch(paymentId),
    ]);
    const expectedUserId = String(order.notes?.userId ?? '');
    const isPaidOrder =
      order.id === orderId &&
      order.status === 'paid' &&
      Number(order.amount) === FORGE_PRO_PRICE_PAISE &&
      Number(order.amount_paid) === FORGE_PRO_PRICE_PAISE &&
      order.currency === FORGE_PRO_CURRENCY &&
      expectedUserId === userId;
    const isCapturedPayment =
      payment.id === paymentId &&
      payment.order_id === orderId &&
      payment.status === 'captured' &&
      payment.captured &&
      payment.amount === FORGE_PRO_PRICE_PAISE &&
      payment.currency === FORGE_PRO_CURRENCY &&
      payment.refund_status !== 'full';

    if (!isPaidOrder || !isCapturedPayment) {
      return NextResponse.json({ success: false, error: 'Payment does not match this account or ForgeOS Pro order.' }, { status: 400 });
    }

    if (!await claimRazorpayPayment(userId, paymentId, orderId)) {
      return NextResponse.json({ success: false, error: 'This payment is already linked to another account.' }, { status: 409 });
    }

    await activatePro(userId);
    revalidatePath('/');
    return NextResponse.json({ success: true, payment_id: paymentId, order_id: orderId });
  } catch (error) {
    console.error('Payment verification failed:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification is temporarily unavailable. Please try again.' },
      { status: 503 },
    );
  }
}
