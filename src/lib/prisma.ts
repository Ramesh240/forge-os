// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

function getPooledDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  let pooledUrl = url;

  // Ensure pgbouncer=true is present for Supabase transaction pooler
  if (pooledUrl.startsWith('postgres') && !pooledUrl.includes('pgbouncer=true')) {
    const separator = pooledUrl.includes('?') ? '&' : '?';
    pooledUrl = `${pooledUrl}${separator}pgbouncer=true`;
  }

  // Ensure connection_limit=1 is present for serverless pooler
  if (pooledUrl.startsWith('postgres') && !pooledUrl.includes('connection_limit=')) {
    const separator = pooledUrl.includes('?') ? '&' : '?';
    pooledUrl = `${pooledUrl}${separator}connection_limit=1`;
  }

  return pooledUrl;
}

const datasourceUrl = getPooledDatabaseUrl();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    datasourceUrl
      ? {
          datasources: {
            db: {
              url: datasourceUrl,
            },
          },
        }
      : undefined
  );

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
