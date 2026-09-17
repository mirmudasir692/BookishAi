import { Agent } from '@mastra/core/agent';
import { TaskSignalProvider } from '@mastra/core/signals';
import { Memory } from '@mastra/memory';
import { searchKnowledgeTool } from '../tools/memory-tools';
import { prompts } from '../utils/prompts';
import { chatModel } from '../config/config';

export const agent = new Agent({
  id: 'bookishai-agent',
  name: 'BookishAI Agent',
  description:
    'An expert, hallucination-free AI tutor for NCERT Science and Physics (Classes 6-12).',
  metadata: {
    suggestedPrompts: [],
  },
  instructions: prompts('SystemPrompt', null),
  model: chatModel,
  defaultOptions: {
    maxSteps: 100,
    autoResumeSuspendedTools: true,
  },
  memory: new Memory({
    options: {
      generateTitle: true,
      observationalMemory: {
        model: chatModel,
      },
    },
  }),
  tools: {
    'search-knowledge': searchKnowledgeTool,
  },
  signals: [new TaskSignalProvider()],
});
