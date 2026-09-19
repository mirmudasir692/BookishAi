export interface ParsedMessage {
  text: string;
  thinking: string;
}

interface MessagePartRecord {
  type?: string;
  toolInvocation?: {
    toolName?: string;
    args?: { query?: string } | string;
    result?: { results?: unknown[]; success?: unknown };
  };
  toolName?: string;
  args?: { query?: string } | string;
  result?: { results?: unknown[]; success?: unknown };
  reasoning?: string;
  text?: string;
  content?: string;
  parts?: unknown[];
  [key: string]: unknown;
}

export function parseMessageContent(raw: unknown): ParsedMessage {
  if (raw === null || raw === undefined) {
    return { text: '', thinking: '' };
  }

  let data: unknown = raw;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        data = JSON.parse(trimmed);
      } catch {
        return { text: trimmed, thinking: '' };
      }
    } else {
      return { text: trimmed, thinking: '' };
    }
  }

  const textParts: string[] = [];
  const thinkingParts: string[] = [];

  const processPart = (part: unknown): void => {
    if (!part || typeof part !== 'object') return;
    const item = part as MessagePartRecord;

    if (item.type === 'tool-invocation' || item.toolInvocation || item.type === 'tool-call') {
      const invocation = item.toolInvocation || item;
      const toolName = invocation.toolName || item.toolName || 'tool';
      const args = invocation.args || item.args;
      const query =
        typeof args === 'object' && args !== null && 'query' in args
          ? (args.query ?? '')
          : typeof args === 'string'
            ? args
            : '';

      let callMsg = query
        ? `🔍 Searching knowledge base for "${query}"...\n`
        : `🔍 Calling tool ${toolName}...\n`;

      const result = invocation.result || item.result;
      if (result) {
        const resultsArray =
          result.results || (Array.isArray(result) ? (result as unknown[]) : null);
        const count = Array.isArray(resultsArray) ? resultsArray.length : null;
        if (count !== null) {
          callMsg += `✅ Found ${count} relevant documents from library.\n\n`;
        } else if (result.success !== undefined || typeof result === 'object') {
          callMsg += `✅ Search completed.\n\n`;
        }
      }

      thinkingParts.push(callMsg);
    } else if (item.type === 'tool-result') {
      const results = item.result?.results;
      const count = Array.isArray(results) ? results.length : null;
      const msg =
        count !== null
          ? `✅ Found ${count} relevant documents from library.\n\n`
          : `✅ Search completed.\n\n`;
      thinkingParts.push(msg);
    } else if (
      item.type === 'reasoning' ||
      item.type === 'thinking' ||
      item.type === 'reasoning-delta'
    ) {
      const reasoning = item.reasoning || item.text || item.content || '';
      if (reasoning) {
        thinkingParts.push(String(reasoning));
      }
    } else if (item.type === 'text' || item.type === 'text-delta') {
      const text = item.text || item.content || '';
      if (typeof text === 'string' && text.trim().length > 0) {
        textParts.push(text);
      }
    }
  };

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const parts = Array.isArray(record.parts)
      ? (record.parts as unknown[])
      : Array.isArray(data)
        ? (data as unknown[])
        : null;

    if (parts && parts.length > 0) {
      for (const part of parts) {
        processPart(part);
      }
    }

    if (record.content && typeof record.content === 'string' && textParts.length === 0) {
      const parsedInner = parseMessageContent(record.content);
      if (parsedInner.text) {
        textParts.push(parsedInner.text);
      }
      if (parsedInner.thinking) {
        thinkingParts.push(parsedInner.thinking);
      }
    } else if (record.content && typeof record.content === 'object' && textParts.length === 0) {
      const parsedInner = parseMessageContent(record.content);
      if (parsedInner.text) {
        textParts.push(parsedInner.text);
      }
      if (parsedInner.thinking) {
        thinkingParts.push(parsedInner.thinking);
      }
    }

    if (
      textParts.length === 0 &&
      typeof record.text === 'string' &&
      record.text.trim().length > 0
    ) {
      textParts.push(record.text);
    }

    if (typeof record.thinking === 'string' && record.thinking.trim().length > 0) {
      thinkingParts.push(record.thinking);
    }
  }

  let finalContent = textParts.join('').trim();
  if (!finalContent && data !== undefined && data !== null) {
    if (typeof data === 'string') {
      finalContent = data.trim();
    } else if (thinkingParts.length === 0) {
      try {
        finalContent = JSON.stringify(data, null, 2);
      } catch {
        finalContent = String(data);
      }
    }
  }

  return {
    text: finalContent,
    thinking: thinkingParts.join('').trim(),
  };
}
