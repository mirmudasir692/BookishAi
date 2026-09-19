import { StreamEvent } from '../dto/agents';

export interface TextDeltaChunk {
  type: 'text-delta';
  payload: { text: string };
}

export interface ReasoningDeltaChunk {
  type: 'reasoning-delta';
  payload: { text: string };
}

export interface ToolCallChunk {
  type: 'tool-call';
  payload: {
    args?: { query?: string };
    toolName?: string;
  };
}

export interface ToolResultChunk {
  type: 'tool-result';
  payload: {
    result?: { results?: unknown[] };
  };
}

export type StreamChunk =
  | TextDeltaChunk
  | ReasoningDeltaChunk
  | ToolCallChunk
  | ToolResultChunk
  | { type: string; payload?: unknown };

export async function* handleStreamEvents(
  fullStream: AsyncIterable<unknown>
): AsyncGenerator<StreamEvent> {
  for await (const item of fullStream) {
    const chunk = item as StreamChunk;
    if (chunk.type === 'text-delta') {
      const payload = chunk.payload as { text: string };
      yield { type: 'answer', content: payload.text };
    } else if (chunk.type === 'reasoning-delta') {
      const payload = chunk.payload as { text: string };
      yield { type: 'thinking', content: payload.text };
    } else if (chunk.type === 'tool-call') {
      const payload = chunk.payload as {
        args?: { query?: string };
        toolName?: string;
      };
      const queryArg = payload?.args?.query;
      const msg = queryArg
        ? `🔍 Searching knowledge base for "${queryArg}"...\n`
        : `🔍 Calling tool ${payload?.toolName || 'search'}...\n`;
      yield { type: 'thinking', content: msg };
    } else if (chunk.type === 'tool-result') {
      const payload = chunk.payload as { result?: { results?: unknown[] } };
      const results = payload?.result?.results;
      const count = Array.isArray(results) ? results.length : null;
      const msg =
        count !== null
          ? `✅ Found ${count} relevant documents from library.\n\n`
          : `✅ Search completed.\n\n`;
      yield { type: 'thinking', content: msg };
    }
  }
}
