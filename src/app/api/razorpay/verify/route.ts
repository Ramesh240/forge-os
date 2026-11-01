import { POST as verifyPayment } from '@/app/api/verify-payment/route';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return verifyPayment(req);
}
