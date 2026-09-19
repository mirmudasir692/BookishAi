import { Buffer } from 'node:buffer';
import type { ZodIssue } from 'zod';
import { ValidationError } from './error';
import { objectClient } from '../modules/storage/bootstrap';

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'svg',
  'bmp',
  'tiff',
]);

function isPDFOrImage(filename: string, contentType: string): boolean {
  if (contentType) {
    const lowerType = contentType.toLowerCase();
    if (lowerType === 'application/pdf' || lowerType.startsWith('image/')) {
      return true;
    }
  }
  const ext = filename.split('.').pop()?.toLowerCase();
  return !!ext && ALLOWED_EXTENSIONS.has(ext);
}

export interface IncomingFile {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

export interface JsonFileInput {
  filename: string;
  contentType: string;
  base64?: string;
}

export interface StoredFile {
  filename: string;
  key: string;
  contentType: string;
  size: number;
  url: string;
}

type StoreChatFilesArgs = {
  threadId: string;
  files?: IncomingFile[];
  jsonFiles?: JsonFileInput[];
};

export async function storeChatFiles({
  threadId,
  files = [],
  jsonFiles = [],
}: StoreChatFilesArgs): Promise<StoredFile[]> {
  const allFiles: IncomingFile[] = [...files];

  for (const jf of jsonFiles) {
    if (jf.base64) {
      allFiles.push({
        filename: jf.filename,
        contentType: jf.contentType,
        buffer: Buffer.from(jf.base64, 'base64'),
      });
    }
  }

  if (allFiles.length === 0) {
    return [];
  }

  for (const file of allFiles) {
    if (!isPDFOrImage(file.filename, file.contentType)) {
      throw new ValidationError('Only PDF and image files are allowed', [
        {
          code: 'custom',
          path: ['files'],
          message: `Invalid file type for file '${file.filename}'. Only PDF and image files are permitted.`,
        } as ZodIssue,
      ]);
    }
  }

  const { service: objectService, endpoint, config } = await objectClient();
  const storedFiles: StoredFile[] = [];

  for (const file of allFiles) {
    const safeName = file.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${threadId}/${Date.now()}-${safeName}`;

    await objectService.put(key, file.buffer, {
      contentType: file.contentType,
    });

    const url = `${endpoint}/${config.bucket}/${key}`;

    storedFiles.push({
      filename: file.filename,
      key,
      contentType: file.contentType,
      size: file.buffer.length,
      url,
    });
  }

  return storedFiles;
}

export function buildFileSummary(storedFiles: StoredFile[]): string {
  return storedFiles
    .map((f) => `[Attached Media URL: ${f.url} | File: ${f.filename} | Type: ${f.contentType}]`)
    .join('\n');
}
