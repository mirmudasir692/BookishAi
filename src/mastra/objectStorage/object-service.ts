// object-service.ts
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { S3Config } from './config';

export interface PutOptions {
  contentType?: string;
}

export interface ObjectService {
  put(key: string, body: Buffer | string, options?: PutOptions): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  del(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  ensureBucket(name?: string): Promise<void>;
}

export interface ObjectServiceDeps {
  client: S3Client;
  config: S3Config;
}

export function createObjectService({ client, config }: ObjectServiceDeps): ObjectService {
  const { bucket } = config;

  return {
    async put(key, body, options = {}) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: options.contentType ?? 'application/octet-stream',
        })
      );
    },

    async get(key) {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!res.Body) return null;

      const chunks: Buffer[] = [];
      for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    },

    async del(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },

    async list(prefix = '') {
      const res = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
      return (res.Contents ?? []).map((o) => o.Key!).filter(Boolean);
    },

    async ensureBucket(name = bucket) {
      try {
        await client.send(new CreateBucketCommand({ Bucket: name }));
      } catch (err: unknown) {
        const errorName = (err as { name?: string })?.name ?? '';
        if (!/BucketAlready/.test(errorName)) throw err;
      }
    },
  };
}
