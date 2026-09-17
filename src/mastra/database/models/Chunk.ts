import * as lancedb from '@lancedb/lancedb';
import { CreateChunkInput } from '../../types/chunk.types';
import { getLanceDbPath } from '../../utils/helpers';

const DB_PATH = getLanceDbPath();
console.log(`[DEBUG] LanceDB Path (Model): ${DB_PATH}`);
const TABLE_NAME = 'chunks';

export class ChunkModel {
  private static async getTable() {
    const db = await lancedb.connect(DB_PATH);
    const tableNames = await db.tableNames();
    if (!tableNames.includes(TABLE_NAME)) {
      throw new Error(`Table ${TABLE_NAME} does not exist.`);
    }
    return await db.openTable(TABLE_NAME);
  }

  static async insertMany(chunks: Omit<CreateChunkInput, 'id' | 'createdAt' | 'updatedAt'>[]) {
    const db = await lancedb.connect(DB_PATH);
    const tableNames = await db.tableNames();

    const dataToInsert = chunks.map((chunk) => ({
      id: crypto.randomUUID(),
      text: chunk.text,
      vector: new Float32Array(chunk.vector),
      metadata: chunk.metadata,
      chunkIndex: chunk.chunkIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (tableNames.includes(TABLE_NAME)) {
      const table = await db.openTable(TABLE_NAME);
      await table.add(dataToInsert);
    } else {
      await db.createTable(TABLE_NAME, dataToInsert);
    }

    return dataToInsert;
  }
}
