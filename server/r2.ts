import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

export function getR2Status(): { configured: boolean; bucket?: string } {
  const configured = isR2Configured();
  return {
    configured,
    bucket: configured ? R2_BUCKET_NAME : undefined,
  };
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured");
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    console.log(`R2 client initialized for bucket: ${R2_BUCKET_NAME}`);
  }

  return s3Client;
}

export async function uploadToR2(
  storageKey: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const client = getS3Client();
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storageKey,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);
}

export async function getSignedDownloadUrl(
  storageKey: string,
  expiresIn: number = 300
): Promise<string> {
  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storageKey,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function deleteFromR2(storageKey: string): Promise<void> {
  const client = getS3Client();
  
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storageKey,
  });

  await client.send(command);
}

if (isR2Configured()) {
  console.log(`R2 configured: true, bucket: ${R2_BUCKET_NAME}`);
} else {
  console.log("R2 configured: false (uploads will be disabled)");
}
