import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { simulate } from '@/core/services/CalculationService';
import type { SimulationInput } from '@/core/types/solar';
import { simulationInputSchema } from '@/server/solar/schemas';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Se Clerk estiver habilitado, exigir usuário autenticado
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const parsed = simulationInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data as SimulationInput;
    const result = simulate(input);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    console.error('POST /api/solar/simulate error:', err);
    return NextResponse.json({ error: 'Erro ao processar simulação' }, { status: 500 });
  }
}