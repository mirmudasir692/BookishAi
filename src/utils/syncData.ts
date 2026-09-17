import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { getProjectRoot } from '../mastra/utils/helpers';

const DATASET_REPO = 'mudasir692/bookishai-data';

export async function ensureDataSynced(): Promise<void> {
  const root = getProjectRoot();
  const LOCAL_DATA_DIR = path.join(root, 'data');
  const lancedbPath = path.join(LOCAL_DATA_DIR, 'lancedb');

  if (existsSync(lancedbPath)) {
    console.log('✅ LanceDB data already exists locally. Skipping download.');
    return;
  }

  console.log('📥 Downloading dataset from Hugging Face...');
  mkdirSync(LOCAL_DATA_DIR, { recursive: true });

  const tempDir = path.join(root, '.hf_temp_data');

  try {
    const cloneCommand = `git clone --depth 1 https://huggingface.co/datasets/${DATASET_REPO} ${tempDir}`;
    execSync(cloneCommand, { stdio: 'inherit', cwd: root });

    const innerDataDir = path.join(tempDir, 'data');

    if (existsSync(innerDataDir)) {
      const items = readdirSync(innerDataDir);
      for (const item of items) {
        renameSync(path.join(innerDataDir, item), path.join(LOCAL_DATA_DIR, item));
      }
    } else {
      const items = readdirSync(tempDir);
      for (const item of items) {
        if (item === '.git') continue;
        renameSync(path.join(tempDir, item), path.join(LOCAL_DATA_DIR, item));
      }
    }

    console.log('✅ Dataset downloaded successfully to ./data');
  } catch (error) {
    console.error('❌ Failed to download dataset from Hugging Face:', error);
    process.exit(1);
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('⚠️ Failed to clean up temporary directory:', e);
    }
  }
}
