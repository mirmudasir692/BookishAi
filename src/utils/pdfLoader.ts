import fs from 'fs';
import path from 'path';
import logger from './logger';
import { parsePdf } from './pdfParser';
import { loadProgress, saveProgress } from './pdfLoader.util';
import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { embeddingModel } from '../mastra/config/config';
import { prepareEmbedding } from './prepareEmbedding';
import { chunkRepository } from '../mastra/database/repositories/ChunkRepository';
import { CreateChunkInput } from '../mastra/types/chunk.types';

const BOOKS_DIR = path.join(process.cwd(), 'books');
const FOLDERS = ['6th', '7th', '8th', '9th', '10th', '11th', '12th', 'side-docs'];

export async function loadBooksSequentially(): Promise<void> {
  const files: string[] = [];

  for (const folder of FOLDERS) {
    const folderPath = path.join(BOOKS_DIR, folder);

    if (!fs.existsSync(folderPath)) {
      continue;
    }
    const folderFiles = fs.readdirSync(folderPath);
    const pdfFiles = folderFiles.filter((file) => file.endsWith('.pdf') || file.endsWith('.md'));
    files.push(...pdfFiles.map((file) => path.join(folderPath, file)));
  }
  const progress = loadProgress();
  const startIndex = progress.currentIndex + 1;
  for (let i = startIndex; i < files.length; i++) {
    const file = files[i];
    let rawText: string;
    const isMarkdown = file.endsWith('.md');
    if (isMarkdown) {
      rawText = fs.readFileSync(file, 'utf-8');
    } else {
      const text = await parsePdf(file);
      rawText = text.text;
    }
    const doc = MDocument.fromText(rawText, {
      metadata: {
        source: file,
        type: isMarkdown ? 'markdown' : 'pdf',
      },
    });
    let chunks;
    if (isMarkdown) {
      chunks = await doc.chunk({
        strategy: 'markdown',
        maxSize: 800,
        overlap: 100,
      });
    } else {
      chunks = await doc.chunk({
        strategy: 'recursive',
        maxSize: 800,
        overlap: 100,
        separators: ['\n\n', '\n', ' ', ''],
      });
    }
    const textsToEmbed = chunks.map((c: { text: string }) => c.text);
    if (textsToEmbed.length > 0) {
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: textsToEmbed,
      });
      const prepared = prepareEmbedding(chunks, embeddings);
      const docsToInsert: CreateChunkInput[] = prepared.map((item, index) => ({
        text: item.text,
        vector: item.embedding,
        metadata: {
          source: file,
          grade: file.split(path.sep).includes('side-docs')
            ? 'side-docs'
            : file.split(path.sep).slice(-2, -1)[0],
        },
        chunkIndex: index,
      }));
      await chunkRepository.addMany(docsToInsert);
    }
    progress.currentIndex = i;
    saveProgress(progress);
  }
}

loadBooksSequentially().catch((err) => {
  logger.error({ err }, 'Error loading books');
});
