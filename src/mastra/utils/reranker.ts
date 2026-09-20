import { LanceChunk } from '../types/chunk.types';
import { cosineSimilarity } from './reranker.util';

export type EmbeddingVector = number[] | Float32Array;

export function rerankBySimilarity(
  queryEmbedding: EmbeddingVector | EmbeddingVector[],
  documents: LanceChunk[],
  limit: number
): LanceChunk[] {
  const queryEmbeddings: EmbeddingVector[] =
    Array.isArray(queryEmbedding[0]) || queryEmbedding[0] instanceof Float32Array
      ? (queryEmbedding as EmbeddingVector[])
      : [queryEmbedding as EmbeddingVector];

  return documents
    .map((document) => {
      const maxScore = Math.max(
        ...queryEmbeddings.map((qEmb) => cosineSimilarity(qEmb, document.vector))
      );
      return {
        document,
        score: maxScore,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ document }) => document);
}
