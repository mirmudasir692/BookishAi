import { Agent } from '@mastra/core/agent';
import { TaskSignalProvider } from '@mastra/core/signals';
import { Memory } from '@mastra/memory';
import { searchKnowledgeTool } from '../tools/memory-tools';
import { prompts } from '../utils/prompts';
import { chatModel } from '../config/config';
import { mcpClient } from '../mcp/client';
import { USE_RAG } from '../config/constants';

async function resolveTools() {
  if (USE_RAG) {
    return { searchKnowledgeTool };
  }

  const mcpTools = await mcpClient.listTools();
  console.log('[okf] MCP returned tools:', Object.keys(mcpTools));

  if (Object.keys(mcpTools).length === 0) {
    console.warn('[okf] MCP returned no tools — check the server spawn');
  }

  return { ...mcpTools };
}

const tools = await resolveTools();

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
  tools,
  signals: [new TaskSignalProvider()],
});
