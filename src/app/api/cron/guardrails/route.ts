import { NextResponse } from 'next/server';
import { runMidnightGuardrailAudit } from '@/app/actions';

export async function GET(request: Request) {
  // Optional bearer token protection for production cron jobs
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await runMidnightGuardrailAudit();

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
}
