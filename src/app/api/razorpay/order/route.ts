// src/app/api/razorpay/order/route.ts
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getActiveUserId } from '@/app/actions';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          error:
            'Razorpay credentials not configured. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local or Vercel Environment Variables.',
        },
        { status: 500 }
      );
    }

    const userId = await getActiveUserId();

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: 15000, // 15000 paise = ₹150.00 INR
      currency: 'INR',
      receipt: `rcpt_forge_${Date.now().toString().slice(-8)}`,
      notes: {
        userId,
        product: 'ForgeOS Pro Lifetime Pass',
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create Razorpay order',
      },
      { status: 500 }
    );
  }
}
