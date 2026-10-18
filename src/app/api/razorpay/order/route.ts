// src/app/api/razorpay/order/route.ts
import { NextResponse } from 'next/server';
import { createOrder, getRazorpayCredentials, extractRazorpayError } from '@/lib/razorpay';
import { getActiveUserId } from '@/app/actions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { keyId, keySecret } = getRazorpayCredentials();

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          error:
            'Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local or Vercel Environment Variables.',
        },
        { status: 500 }
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

    const amount = body.amount !== undefined ? Number(body.amount) : 15000;
    if (isNaN(amount) || amount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least 100 paise (₹1.00).' },
        { status: 400 }
      );
    }

    const userId = await getActiveUserId();

    const orderData = await createOrder({
      amount,
      currency: body.currency || 'INR',
      receipt: body.receipt,
      notes: {
        userId,
        product: 'ForgeOS Pro Lifetime Pass',
      },
    });

    return NextResponse.json(orderData);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    const errorMessage = extractRazorpayError(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
