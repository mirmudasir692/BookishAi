import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { embed } from 'ai';
import logger from '../../utils/logger';
import { embeddingModel } from '../config/config';
import { chunkRepository } from '../database/repositories/ChunkRepository';
import { LanceChunk } from '../types/chunk.types';
import { rerankBySimilarity } from '../utils/reranker';

export const searchKnowledgeTool = createTool({
  id: 'search-knowledge',
  description:
    'MANDATORY FIRST STEP: This is the ONLY source of truth for physics formulas, definitions, and concepts. You MUST call this tool before generating any text for science or math questions. You cannot answer without it.',
  inputSchema: z.object({
    query: z.string().describe('The search query or question to find relevant memories.'),
    limit: z.number().optional().default(5).describe('Number of results to return'),
  }),
  execute: async ({ query, limit }) => {
    try {
      limit = Math.max(limit || 5, 3);
      const fetchLimit = limit * 4;

      const { embedding } = await embed({
        model: embeddingModel,
        value: query,
      });
      const rawResults = await chunkRepository.search(embedding, fetchLimit);
      if (rawResults.length === 0) {
        return { success: true, results: [], message: 'No relevant documents found.' };
      }

      const docsForPrompt = rawResults
        .map((r: LanceChunk, index: number) => `[Document ${index}]: ${r.text}`)
        .join('\n\n');
      console.log('docs for prompt', docsForPrompt);
      const rerankedResults = rerankBySimilarity(embedding, rawResults, limit);
      const cleanResults = rerankedResults.map(({ vector: _v, ...rest }) => rest);
      console.log('reranked results', cleanResults);

      return {
        success: true,
        results: cleanResults,
        candidatesEvaluated: rawResults.length,
      };
    } catch (error) {
      logger.error({ error }, 'Error in searchKnowledgeTool');
      return { success: false, message: 'An error occurred while searching knowledge.' };
    }
  },
});
