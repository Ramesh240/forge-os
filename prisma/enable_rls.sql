-- Migration: Enable Row Level Security (RLS) on public tables
-- Fixes Supabase linter warning: "RLS Disabled in Public" for IdentityVector, Habit, SessionLog

-- 1. Enable RLS on public tables
ALTER TABLE "public"."IdentityVector" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Habit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SessionLog" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage own identity vectors" ON "public"."IdentityVector";
DROP POLICY IF EXISTS "Users can manage own habits" ON "public"."Habit";
DROP POLICY IF EXISTS "Users can manage own session logs" ON "public"."SessionLog";

-- 3. IdentityVector Policy (Scoped by userId - user email / auth.uid)
CREATE POLICY "Users can manage own identity vectors"
ON "public"."IdentityVector"
FOR ALL
TO authenticated
USING (
  "userId" = auth.uid()::text OR "userId" = (auth.jwt() ->> 'email')
)
WITH CHECK (
  "userId" = auth.uid()::text OR "userId" = (auth.jwt() ->> 'email')
);

-- 4. Habit Policy (Scoped via foreign key relation to IdentityVector)
CREATE POLICY "Users can manage own habits"
ON "public"."Habit"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."IdentityVector" iv
    WHERE iv.id = "Habit"."identityId"
      AND (iv."userId" = auth.uid()::text OR iv."userId" = (auth.jwt() ->> 'email'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."IdentityVector" iv
    WHERE iv.id = "Habit"."identityId"
      AND (iv."userId" = auth.uid()::text OR iv."userId" = (auth.jwt() ->> 'email'))
  )
);

-- 5. SessionLog Policy (Scoped via foreign key relation to IdentityVector)
CREATE POLICY "Users can manage own session logs"
ON "public"."SessionLog"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."IdentityVector" iv
    WHERE iv.id = "SessionLog"."identityId"
      AND (iv."userId" = auth.uid()::text OR iv."userId" = (auth.jwt() ->> 'email'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."IdentityVector" iv
    WHERE iv.id = "SessionLog"."identityId"
      AND (iv."userId" = auth.uid()::text OR iv."userId" = (auth.jwt() ->> 'email'))
  )
);
