import * as lancedb from '@lancedb/lancedb';
import { CreateChunkInput, CreateChunkOutput } from '../../types/chunk.types';
import { ChunkOutput } from '../../types/chunk.types';
import { getLanceDbPath } from '../../utils/helpers';

const DB_PATH = getLanceDbPath();
console.log(`[DEBUG] Calculated LanceDB Path: ${DB_PATH}`);
const TABLE_NAME = 'chunks';

class ChunkRepository {
  public async addMany(chunks: CreateChunkInput[]): Promise<CreateChunkOutput> {
    if (!chunks || chunks.length === 0) {
      return [];
    }

    try {
      const db = await lancedb.connect(DB_PATH);

      const lanceData = chunks.map((chunk) => ({
        id: crypto.randomUUID(),
        text: chunk.text,
        vector: new Float32Array(chunk.vector),
        metadata: chunk.metadata,
        chunkIndex: chunk.chunkIndex,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const tableNames = await db.tableNames();
      let table;

      if (tableNames.includes(TABLE_NAME)) {
        table = await db.openTable(TABLE_NAME);
        await table.add(lanceData);
      } else {
        table = await db.createTable(TABLE_NAME, lanceData);
      }

      console.log(`✅ Inserted ${lanceData.length} chunks into LanceDB.`);
      return lanceData as any as CreateChunkOutput;
    } catch (error) {
      console.error('Error in ChunkRepository.addMany:', error);
      throw new Error('Failed to insert chunks into LanceDB.', { cause: error });
    }
  }
  public async search(queryVector: number[], limit: number = 5): Promise<ChunkOutput[]> {
    try {
      const db = await lancedb.connect(DB_PATH);
      const table = await db.openTable(TABLE_NAME);

      const results = await table.search(new Float32Array(queryVector)).limit(limit).toArray();

      return results;
    } catch (error) {
      console.error('Error in ChunkRepository.search:', error);
      throw new Error('Failed to search chunks in LanceDB.', { cause: error });
    }
  }
}

export const chunkRepository = new ChunkRepository();
