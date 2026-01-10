import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
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

export async function listAllR2Keys(): Promise<string[]> {
  if (!isR2Configured()) {
    return [];
  }

  const client = getS3Client();
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });

    const response = await client.send(command);
    
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          keys.push(obj.Key);
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return keys;
}

export async function bulkDeleteFromR2(keys: string[]): Promise<number> {
  if (!isR2Configured() || keys.length === 0) {
    return 0;
  }

  const client = getS3Client();
  let deleted = 0;

  const batches: string[][] = [];
  for (let i = 0; i < keys.length; i += 1000) {
    batches.push(keys.slice(i, i + 1000));
  }

  for (const batch of batches) {
    const command = new DeleteObjectsCommand({
      Bucket: R2_BUCKET_NAME,
      Delete: {
        Objects: batch.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });

    await client.send(command);
    deleted += batch.length;
  }

  return deleted;
}

if (isR2Configured()) {
  console.log(`R2 configured: true, bucket: ${R2_BUCKET_NAME}`);
} else {
  console.log("R2 configured: false (uploads will be disabled)");
}
