import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { embedMany } from 'ai'; // Changed from 'embed' to 'embedMany'
import logger from '../../utils/logger';
import { embeddingModel } from '../config/config';
import { chunkRepository } from '../database/repositories/ChunkRepository';
import { LanceChunk } from '../types/chunk.types';
import { rerankBySimilarity } from '../utils/reranker';

export const searchKnowledgeTool = createTool({
  id: 'search-knowledge',
  description:
    'MANDATORY FIRST STEP: This is the ONLY source of truth for physics formulas, definitions, and concepts. You MUST call this tool before generating any text for science or math questions. You cannot answer without it. Supports multiple queries for comprehensive search.',
  inputSchema: z
    .object({
      query: z
        .string()
        .optional()
        .describe('A single search query. Use for simple, single-faceted questions.'),
      queries: z
        .array(z.string())
        .optional()
        .describe(
          'An array of multiple search queries. Use for complex topics requiring multiple perspectives or phrasings.'
        ),
      limit: z
        .number()
        .optional()
        .default(5)
        .describe('Total number of results to return across all queries'),
    })
    .refine((data) => data.query || (data.queries && data.queries.length > 0), {
      message: "You must provide either 'query' or 'queries'.",
    }),
  execute: async ({ query, queries, limit }) => {
    try {
      limit = Math.max(limit || 5, 3);
      const searchQueries = queries || [query!];

      const fetchLimit = Math.max(Math.ceil((limit * 4) / searchQueries.length), 5);

      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: searchQueries,
      });

      const allRawResults: LanceChunk[] = [];

      for (const emb of embeddings) {
        const results = await chunkRepository.search(emb, fetchLimit);
        allRawResults.push(...results);
      }

      if (allRawResults.length === 0) {
        return { success: true, results: [], message: 'No relevant documents found.' };
      }

      const uniqueResultsMap = new Map<string, LanceChunk>();
      for (const res of allRawResults) {
        const key = res.id || res.text;
        if (!uniqueResultsMap.has(key)) {
          uniqueResultsMap.set(key, res);
        }
      }
      const rawResults = Array.from(uniqueResultsMap.values());

      const docsForPrompt = rawResults
        .map((r: LanceChunk, index: number) => `[Document ${index}]: ${r.text}`)
        .join('\n\n');
      console.log('docs for prompt', docsForPrompt);

      const rerankedResults = rerankBySimilarity(embeddings, rawResults, limit);

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
