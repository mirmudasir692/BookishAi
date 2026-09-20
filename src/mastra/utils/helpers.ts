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

export function generateId(): string {
  return randomUUID();
}
