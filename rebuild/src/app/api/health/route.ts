import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const uptime = process.uptime();
  const now = new Date();
  const version = process.env.npm_package_version || '0.0.0';

  const db: { connected: boolean; error?: string; latency_ms?: number } = { connected: false };
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());

  if (hasDatabaseUrl) {
    try {
      const start = Date.now();
      // Verifica conectividade básica com o banco e mede latência
      await prisma.$queryRaw`SELECT 1`;
      db.connected = true;
      db.latency_ms = Date.now() - start;
    } catch (err) {
      db.error = err instanceof Error ? err.message : 'Unknown database error';
    }
  } else {
    db.error = 'DATABASE_URL not set';
  }

  return NextResponse.json({
    status: 'ok',
    version,
    time: now.toISOString(),
    uptime_seconds: Math.round(uptime),
    node_env: process.env.NODE_ENV,
    database: {
      ...db,
      hasDatabaseUrl,
      provider: 'postgresql',
    },
  });
}