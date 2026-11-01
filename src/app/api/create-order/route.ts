// src/app/api/create-order/route.ts
import { NextResponse } from 'next/server';
import { createOrder, getRazorpayCredentials, extractRazorpayError, FORGE_PRO_PRICE_PAISE, FORGE_PRO_CURRENCY } from '@/lib/razorpay';
import { getActiveUserId } from '@/app/actions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { keyId, keySecret } = getRazorpayCredentials();

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          error:
            'Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local or environment variables.',
        },
        { status: 401 }
      );
    }

    let body: { amount?: number; currency?: string; receipt?: string } = {};
    const text = await req.text();
    if (text && text.trim()) {
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON request body.' },
          { status: 400 }
        );
      }
    }

    const userId = await getActiveUserId();
    const receipt = body.receipt;

    const orderData = await createOrder({
      amount: FORGE_PRO_PRICE_PAISE,
      currency: FORGE_PRO_CURRENCY,
      receipt,
      notes: {
        userId,
        product: 'ForgeOS Pro Lifetime Pass',
      },
    });

    return NextResponse.json(orderData, { status: 200 });
  } catch (error) {
    console.error('Error in /api/create-order:', error);
    const errorMessage = extractRazorpayError(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
