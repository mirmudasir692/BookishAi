export interface ParsedMessage {
  text: string;
  thinking: string;
}

/**
 * Extracts human-readable markdown text and collapsible thinking/tool-invocation
 * details from raw Mastra memory messages or stringified AI SDK payloads.
 */
export function parseMessageContent(raw: unknown): ParsedMessage {
  if (raw === null || raw === undefined) {
    return { text: '', thinking: '' };
  }

  let data: any = raw;

  // 1. If data is a string, check if it's a JSON-serialized object
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        data = JSON.parse(trimmed);
      } catch {
        // Plain text string
        return { text: data, thinking: '' };
      }
    } else {
      return { text: data, thinking: '' };
    }
  }

  const textParts: string[] = [];
  const thinkingParts: string[] = [];

  // Helper to extract tool invocation and reasoning from a part item
  const processPart = (part: any) => {
    if (!part || typeof part !== 'object') return;

    // Tool Invocation / Call
    if (part.type === 'tool-invocation' || part.toolInvocation || part.type === 'tool-call') {
      const invocation = part.toolInvocation || part;
      const toolName = invocation.toolName || part.toolName || 'tool';
      const args = invocation.args || part.args;
      const query = args?.query || (typeof args === 'string' ? args : '');

      let callMsg = query
        ? `🔍 Searching knowledge base for "${query}"...\n`
        : `🔍 Calling tool ${toolName}...\n`;

      const result = invocation.result || part.result;
      if (result) {
        const resultsArray = result.results || (Array.isArray(result) ? result : null);
        const count = Array.isArray(resultsArray) ? resultsArray.length : null;
        if (count !== null) {
          callMsg += `✅ Found ${count} relevant documents from library.\n\n`;
        } else if (result.success !== undefined || typeof result === 'object') {
          callMsg += `✅ Search completed.\n\n`;
        }
      }

      thinkingParts.push(callMsg);
    }
    // Tool Result (separate part)
    else if (part.type === 'tool-result') {
      const results = part.result?.results;
      const count = Array.isArray(results) ? results.length : null;
      const msg =
        count !== null
          ? `✅ Found ${count} relevant documents from library.\n\n`
          : `✅ Search completed.\n\n`;
      thinkingParts.push(msg);
    }
    // Reasoning / Thinking text
    else if (
      part.type === 'reasoning' ||
      part.type === 'thinking' ||
      part.type === 'reasoning-delta'
    ) {
      const reasoning = part.reasoning || part.text || part.content || '';
      if (reasoning) {
        thinkingParts.push(String(reasoning));
      }
    }
    // Text output part
    else if (part.type === 'text' || part.type === 'text-delta') {
      const text = part.text || part.content || '';
      if (typeof text === 'string' && text.trim().length > 0) {
        textParts.push(text);
      }
    }
  };

  // 2. If data has parts array (Mastra / AI SDK format)
  if (data && typeof data === 'object') {
    const parts = Array.isArray(data.parts) ? data.parts : Array.isArray(data) ? data : null;

    if (parts && parts.length > 0) {
      for (const part of parts) {
        processPart(part);
      }
    }

    // Check direct content field
    if (data.content && typeof data.content === 'string' && textParts.length === 0) {
      const parsedInner = parseMessageContent(data.content);
      if (parsedInner.text) {
        textParts.push(parsedInner.text);
      }
      if (parsedInner.thinking) {
        thinkingParts.push(parsedInner.thinking);
      }
    } else if (data.content && typeof data.content === 'object' && textParts.length === 0) {
      const parsedInner = parseMessageContent(data.content);
      if (parsedInner.text) {
        textParts.push(parsedInner.text);
      }
      if (parsedInner.thinking) {
        thinkingParts.push(parsedInner.thinking);
      }
    }

    // Check direct text field if textParts is still empty
    if (textParts.length === 0 && typeof data.text === 'string' && data.text.trim().length > 0) {
      textParts.push(data.text);
    }

    // Check direct thinking field
    if (typeof data.thinking === 'string' && data.thinking.trim().length > 0) {
      thinkingParts.push(data.thinking);
    }
  }

  // Fallback if no text could be extracted
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
