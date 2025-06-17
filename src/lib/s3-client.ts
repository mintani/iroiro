import { env } from "@/env";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as getSignedUrlPresigner } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: env.S3_REGION ?? "auto",
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? "",
  },
  forcePathStyle: true,
});

export const generateDownloadUrl = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET ?? "app",
    Key: key,
  });

  return await getSignedUrlPresigner(s3, command, {
    expiresIn: 60 * 60 * 24 * 3, // 3 days
  });
};
