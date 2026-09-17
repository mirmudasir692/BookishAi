import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { embed, generateText } from 'ai';
import { chatModel, embeddingModel, rerankingModel } from '../config/config';
import { chunkRepository } from '../database/repositories/ChunkRepository';
import { prompts } from '../utils/prompts';
import { cleanupText } from '../utils/helpers';

export const searchKnowledgeTool = createTool({
  id: 'search-knowledge',
  description:
    'MANDATORY FIRST STEP: This is the ONLY source of truth for physics formulas, definitions, and concepts. You MUST call this tool before generating any text for science or math questions. You cannot answer without it.',
  inputSchema: z.object({
    query: z.string().describe('The search query or question to find relevant memories.'),
    limit: z.number().optional().default(5).describe('Number of results to return'),
    useHyDE: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to use Hypothetical Document Embeddings for better semantic matching.'),
  }),
  execute: async ({ query, limit, useHyDE }) => {
    try {
      let searchText = query;
      limit = Math.max(limit || 5, 3);
      if (useHyDE) {
        const { text: queryRewrite } = await generateText({
          model: chatModel,
          prompt: prompts('QueryRewrite', query),
        });
        searchText = queryRewrite;
        console.log(
          '✅ [Phase 1] HyDE Generated. Searching with this text instead of raw query.',
          queryRewrite
        );
      }
      const fetchLimit = limit * 4;
      console.log(
        `[Phase 2] Embedding text and fetching top ${fetchLimit} candidates from LanceDB...`
      );

      const { embedding } = await embed({
        model: embeddingModel,
        value: searchText,
      });
      const rawResults = await chunkRepository.search(embedding, fetchLimit);
      if (rawResults.length === 0) {
        return { success: true, results: [], message: 'No relevant documents found.' };
      }
      console.log(`⚖️ [Phase 3] Asking Qwen to rerank ${rawResults.length} candidates...`);
      const docsForPrompt = rawResults
        .map((r: any, index: number) => `[Document ${index}]: ${r.text}`)
        .join('\n\n');
      const { text: rankedIndicesStr } = await generateText({
        model: rerankingModel,
        prompt: prompts('Rerank', { query, documents: docsForPrompt }),
        temperature: 0,
      });
      console.log('rankedIndicesStr', rankedIndicesStr);
      const rerankedResults = cleanupText(searchText, rankedIndicesStr, rawResults, limit);
      console.log(`[Complete] Returning top ${rerankedResults.length} reranked results.`);

      return {
        success: true,
        results: rerankedResults,
        hyDEUsed: useHyDE,
        candidatesEvaluated: rawResults.length,
      };
    } catch (error) {
      console.error('Error in searchKnowledgeTool:', error);
      return { success: false, message: 'An error occurred while searching knowledge.' };
    }
  },
});
