// src/app/api/razorpay/verify/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getActiveUserId, ensureUserWorkspaceSeeded } from '@/app/actions';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay payment verification parameters.' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: 'RAZORPAY_KEY_SECRET is not configured on the server.' },
        { status: 500 }
      );
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(generatedSignature, 'utf-8');
    const receivedBuffer = Buffer.from(razorpay_signature, 'utf-8');

    const isAuthentic =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

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

    revalidatePath('/');

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
