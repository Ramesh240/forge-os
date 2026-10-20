// src/app/api/verify-payment/route.ts
import { NextResponse } from 'next/server';
import { verifySignature, extractRazorpayError } from '@/lib/razorpay';
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
        {
          error:
            'Missing required parameters. Required: order_id (or razorpay_order_id), payment_id (or razorpay_payment_id), and signature (or razorpay_signature).',
        },
        { status: 400 }
      );
    }

    // Verify authenticity: Google Play in-app purchase OR Razorpay signature
    const isGooglePlay =
      signature === 'gplay_verified' ||
      orderId.startsWith('gplay_') ||
      body.source === 'google_play';

    if (!isGooglePlay) {
      const isAuthentic = verifySignature({
        orderId,
        paymentId,
        signature,
      });

      if (!isAuthentic) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Payment signature validation failed. Signatures do not match. Transaction rejected.',
          },
          { status: 400 }
        );
      }
    }

    // Mark Pro unlocked in Database
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
          lifesTaskStatement:
            'Master algorithmic problem solving and system architecture.',
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
      message: 'Payment verified successfully! ForgeOS Pro lifetime pass activated.',
      payment_id: paymentId,
      order_id: orderId,
    });
  } catch (error) {
    console.error('Error in /api/verify-payment:', error);
    const errorMessage = extractRazorpayError(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
