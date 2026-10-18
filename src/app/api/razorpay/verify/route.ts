// src/app/api/razorpay/verify/route.ts
import { NextResponse } from 'next/server';
import { verifySignature } from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';
import { getActiveUserId, ensureUserWorkspaceSeeded } from '@/app/actions';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = body.razorpay_order_id || body.order_id;
    const paymentId = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay payment verification parameters.' },
        { status: 400 }
      );
    }

    const isAuthentic = verifySignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isAuthentic) {
      return NextResponse.json(
        { error: 'Payment signature validation failed. Transaction could not be verified.' },
        { status: 400 }
      );
    }

    // Payment authentic: Unlock ForgeOS Pro for active user
    const userId = await getActiveUserId();
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

    try {
      revalidatePath('/');
    } catch {
      // safe fallback
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified! ForgeOS Pro lifetime pass activated.',
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Payment verification failed',
      },
      { status: 500 }
    );
  }
}
