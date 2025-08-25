import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const uptime = process.uptime();
  const now = new Date();
  const version = process.env.npm_package_version || '0.0.0';

  const db = { connected: false as boolean, error: undefined as string | undefined };
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());

  if (hasDatabaseUrl) {
    try {
      // Verifica conectividade básica com o banco
      await prisma.$queryRaw`SELECT 1`;
      db.connected = true;
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
    database: db,
  });
}