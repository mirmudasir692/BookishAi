import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';

export function getProjectRoot(): string {
  let curr = process.cwd();
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'package.json'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

export function getLanceDbPath(): string {
  if (process.env.LANCE_DB_PATH) {
    return process.env.LANCE_DB_PATH;
  }
  const root = getProjectRoot();
  return path.join(root, 'data', 'lancedb');
}

export interface SearchResultItem {
  text: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

const cleanupText = <T extends SearchResultItem>(
  _text: string,
  rankedIndicesStr: string,
  rawResults: T[],
  limit: number
): { text: string; metadata?: Record<string, unknown> }[] => {
  const matches = rankedIndicesStr.match(/\d+/g) || [];

  const rankedIndices = matches
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n) && n >= 0 && n < rawResults.length);

  const uniqueIndices = [...new Set(rankedIndices)];

  const rerankedResults = uniqueIndices
    .map((idx) => rawResults[idx])
    .slice(0, limit)
    .map((r) => ({
      text: r.text,
      metadata: r.metadata,
    }));

  return rerankedResults;
};

function generateId(): string {
  return randomUUID();
}

export { cleanupText, generateId };
