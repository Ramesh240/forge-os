import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Enabling Row Level Security (RLS) on newly created public tables...');

  // Enable RLS on PlayPurchase
  await prisma.$executeRawUnsafe(`ALTER TABLE "public"."PlayPurchase" ENABLE ROW LEVEL SECURITY;`);
  console.log('✓ RLS enabled on public.PlayPurchase');

  // Enable RLS on RazorpayPayment
  await prisma.$executeRawUnsafe(`ALTER TABLE "public"."RazorpayPayment" ENABLE ROW LEVEL SECURITY;`);
  console.log('✓ RLS enabled on public.RazorpayPayment');

  // Query PostgreSQL pg_tables to verify RLS status for all public tables
  const tables: Array<{ tablename: string; rowsecurity: boolean }> = await prisma.$queryRawUnsafe(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public';
  `);

  console.log('\nCurrent RLS status for public tables:');
  console.table(tables);
}

main()
  .catch((e) => {
    console.error('Error enabling RLS:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

