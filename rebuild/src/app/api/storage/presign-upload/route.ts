import { NextResponse } from "next/server";
import { createS3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
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
    const { key, contentType } = json as { key?: string; contentType?: string };

    if (!key || !contentType) {
      return NextResponse.json({ error: "Parâmetros obrigatórios: key, contentType" }, { status: 400 });
    }

    const bucket = process.env.MINIO_BUCKET;
    if (!bucket) return NextResponse.json({ error: "MINIO_BUCKET não configurado" }, { status: 500 });

    const s3 = createS3Client();
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 minutos

    return NextResponse.json({ url });
  } catch (err) {
    console.error("POST /api/storage/presign-upload error:", err);
    return NextResponse.json({ error: "Erro ao gerar URL assinada" }, { status: 500 });
  }
}