import * as lancedb from '@lancedb/lancedb';
import { getLanceDbPath } from '../utils/helpers';

const DB_PATH = getLanceDbPath();

export async function getLanceTable(tableName: string = 'chunks') {
  const db = await lancedb.connect(DB_PATH);
  const tableNames = await db.listTables();

  if (!tableNames.tables.includes(tableName)) {
    throw new Error(`Table ${tableName} does not exist. Please run the migration first.`);
  }

  return await db.openTable(tableName);
}

export async function createLanceTable(
  tableName: string = 'chunks',
  data: Record<string, unknown>[]
) {
  const db = await lancedb.connect(DB_PATH);
  return await db.createTable(tableName, data);
}
