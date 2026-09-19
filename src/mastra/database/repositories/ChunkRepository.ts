import * as lancedb from '@lancedb/lancedb';
import { CreateChunkInput, CreateChunkOutput, LanceChunk } from '../../types/chunk.types';
import { getLanceDbPath } from '../../utils/helpers';

const DB_PATH = getLanceDbPath();
const TABLE_NAME = 'chunks';

class ChunkRepository {
  public async addMany(chunks: CreateChunkInput[]): Promise<CreateChunkOutput> {
    if (!chunks || chunks.length === 0) {
      return [];
    }

    try {
      const db = await lancedb.connect(DB_PATH);

      const lanceData: LanceChunk[] = chunks.map((chunk) => ({
        id: crypto.randomUUID(),
        text: chunk.text,
        vector: new Float32Array(chunk.vector),
        metadata: chunk.metadata as Record<string, unknown>,
        chunkIndex: chunk.chunkIndex,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const tableNames = await db.tableNames();

      if (tableNames.includes(TABLE_NAME)) {
        const table = await db.openTable(TABLE_NAME);
        await table.add(lanceData);
      } else {
        await db.createTable(TABLE_NAME, lanceData);
      }

      return lanceData;
    } catch (error) {
      throw new Error('Failed to insert chunks into LanceDB.', { cause: error });
    }
  }

  public async search(queryVector: number[], limit: number = 5): Promise<LanceChunk[]> {
    try {
      const db = await lancedb.connect(DB_PATH);
      const table = await db.openTable(TABLE_NAME);

      const results = (await table
        .search(new Float32Array(queryVector))
        .limit(limit)
        .toArray()) as unknown as LanceChunk[];

      return results;
    } catch (error) {
      throw new Error('Failed to search chunks in LanceDB.', { cause: error });
    }
  }
}

export const chunkRepository = new ChunkRepository();
