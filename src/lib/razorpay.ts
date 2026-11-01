// src/lib/razorpay.ts
import Razorpay from 'razorpay';
import crypto from 'crypto';

function sanitizeKey(val: string | undefined): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export const FORGE_PRO_PRICE_PAISE = 15000;
export const FORGE_PRO_CURRENCY = 'INR';

/**
 * Server-only Razorpay configuration.
 * Credentials must be explicitly configured in the server environment.
 */
export const RazorpayConfig = {
  get keyId() {
    return sanitizeKey(process.env.RAZORPAY_KEY_ID);
  },
  get keySecret() {
    return sanitizeKey(process.env.RAZORPAY_KEY_SECRET);
  },
  get isConfigured() {
    return Boolean(sanitizeKey(process.env.RAZORPAY_KEY_ID) && sanitizeKey(process.env.RAZORPAY_KEY_SECRET));
  },
};

export const Config = RazorpayConfig;

export function getRazorpayCredentials() {
  return {
    keyId: RazorpayConfig.keyId,
    keySecret: RazorpayConfig.keySecret,
  };
}

export function getRazorpayClient(): Razorpay {
  const { keyId, keySecret } = getRazorpayCredentials();

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export interface CreateOrderParams {
  amount?: number; // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export async function createOrder({
  amount = FORGE_PRO_PRICE_PAISE,
  currency = FORGE_PRO_CURRENCY,
  receipt,
  notes,
}: CreateOrderParams) {
  if (typeof amount !== 'number' || amount < 100) {
    throw new Error('Minimum order amount must be at least 100 paise (₹1.00).');
  }

  const razorpay = getRazorpayClient();
  const orderReceipt = receipt || `rcpt_${Date.now().toString().slice(-8)}`;

  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt: orderReceipt,
    notes: notes || {},
  });

  const { keyId } = getRazorpayCredentials();

  return {
    order_id: order.id,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    key_id: keyId,
    keyId: keyId,
  };
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export function verifySignature({
  orderId,
  paymentId,
  signature,
}: VerifySignatureParams): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const { keySecret } = getRazorpayCredentials();
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured on the server.');
  }

  const payload = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');

  const expectedBuffer = Buffer.from(generatedSignature, 'utf-8');
  const receivedBuffer = Buffer.from(signature, 'utf-8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

/**
 * Extracts human-readable error descriptions from Razorpay errors
 * (Razorpay SDK often rejects with plain objects rather than Error instances).
 */
export function extractRazorpayError(error: unknown): string {
  if (!error) return 'Unknown error occurred while processing Razorpay request.';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    const nestedError = errObj.error as Record<string, unknown> | undefined;
    if (nestedError?.description && typeof nestedError.description === 'string') {
      return nestedError.description;
    }
    if (errObj.description && typeof errObj.description === 'string') {
      return errObj.description;
    }
    if (errObj.message && typeof errObj.message === 'string') {
      return errObj.message;
    }
    try {
      return JSON.stringify(errObj);
    } catch {
      return String(error);
    }
  }
  return String(error);
}
