import { Request } from 'express';
import { ExtractedMulterFile } from './agents.types';
import { StoredFile } from '../../types/utils.types';
import { buildFileSummary } from '../../utils/file-utils';

export function extractMulterFiles(req: Request): ExtractedMulterFile[] {
  const incomingFiles: ExtractedMulterFile[] = [];
  const multerFiles = req.files
    ? Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat()
    : req.file
      ? [req.file]
      : [];

  for (const file of multerFiles) {
    if (file.buffer) {
      incomingFiles.push({
        filename: file.originalname || file.filename || 'file',
        contentType: file.mimetype || 'application/octet-stream',
        buffer: file.buffer,
      });
    }
  }

  return incomingFiles;
}

export function buildAgentQueryContext(
  userQuery: string | undefined,
  extractedPdfTexts: string[],
  storedFiles: StoredFile[]
): string {
  const contextParts: string[] = [];

  if (extractedPdfTexts.length > 0) {
    contextParts.push(...extractedPdfTexts);
  }

  const nonPdfFiles = storedFiles.filter((sf) => sf.contentType !== 'application/pdf');
  if (nonPdfFiles.length > 0) {
    contextParts.push(buildFileSummary(nonPdfFiles));
  }

  const isPlaceholderQuery = userQuery && /^\[Attached File: .*\]$/.test(userQuery.trim());
  const validUserQuery = isPlaceholderQuery ? '' : (userQuery ?? '').trim();

  if (contextParts.length > 0) {
    return validUserQuery !== ''
      ? `${validUserQuery}\n\n${contextParts.join('\n\n')}`
      : contextParts.join('\n\n');
  }

  return validUserQuery;
}
