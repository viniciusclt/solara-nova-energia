import { S3Client } from "@aws-sdk/client-s3";

export function createS3Client() {
  const endpoint = process.env.MINIO_ENDPOINT || "localhost";
  const port = process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000;
  const useSSL = String(process.env.MINIO_USE_SSL || "false").toLowerCase() === "true";
  const region = process.env.MINIO_REGION || "us-east-1";
  const accessKeyId = process.env.MINIO_ACCESS_KEY || "";
  const secretAccessKey = process.env.MINIO_SECRET_KEY || "";

  return new S3Client({
    region,
    endpoint: `${useSSL ? "https" : "http"}://${endpoint}:${port}`,
    forcePathStyle: true,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });
}