export interface LanceChunk extends Record<string, unknown> {
  id: string;
  text: string;
  vector: Float32Array;
  metadata: Record<string, unknown>;
  chunkIndex: number;
  createdAt: string;
  updatedAt: string;
}
export interface IChunkMetadata {
  source: string;
  grade?: string;
  [key: string]: any;
}
export interface CreateChunkInput {
  text: string;
  vector: number[];
  metadata: IChunkMetadata;
  chunkIndex: number;
}
export type ChunkOutput = LanceChunk[];
export type CreateChunkOutput = LanceChunk[];
