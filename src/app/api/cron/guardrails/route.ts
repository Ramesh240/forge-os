import { NextResponse } from 'next/server';
import { runMidnightGuardrailAudit } from '@/app/actions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Bearer token protection for production cron jobs
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runMidnightGuardrailAudit();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('Guardrails cron audit failed:', error);
    return NextResponse.json(
      {
        error: 'Guardrail audit failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
