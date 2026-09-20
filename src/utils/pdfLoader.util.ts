import fs from 'fs';
import path from 'path';
import { ProgressState } from '../mastra/types/utils.types';

const META_FILE = path.join(process.cwd(), 'progress.json');

export function loadProgress(): ProgressState {
  if (fs.existsSync(META_FILE)) {
    try {
      const data = fs.readFileSync(META_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      //
    }
  }
  return {
    currentIndex: -1,
  };
}

export function saveProgress(state: ProgressState): void {
  fs.writeFileSync(META_FILE, JSON.stringify(state, null, 2), 'utf-8');
}
