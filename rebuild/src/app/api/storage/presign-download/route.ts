import { NextResponse } from "next/server";
import { createS3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json().catch(() => ({}));
    const { key } = json as { key?: string };

    if (!key) {
      return NextResponse.json({ error: "Parâmetro obrigatório: key" }, { status: 400 });
    }

    const bucket = process.env.MINIO_BUCKET;
    if (!bucket) return NextResponse.json({ error: "MINIO_BUCKET não configurado" }, { status: 500 });

    const s3 = createS3Client();
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 minutos

    return NextResponse.json({ url });
  } catch (err) {
    console.error("POST /api/storage/presign-download error:", err);
    return NextResponse.json({ error: "Erro ao gerar URL de download" }, { status: 500 });
  }
}