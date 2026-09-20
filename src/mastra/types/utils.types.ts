import { Buffer } from 'node:buffer';

export interface ProgressState {
  currentIndex: number;
}

export interface IncomingFile {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

export interface JsonFileInput {
  filename: string;
  contentType: string;
  base64?: string;
  key?: string;
}

export interface StoredFile {
  filename: string;
  key: string;
  contentType: string;
  size: number;
  url: string;
  localPath?: string;
}

export interface StoreChatFilesArgs {
  threadId: string;
  files?: IncomingFile[];
  jsonFiles?: JsonFileInput[];
}

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

export interface ParsedMessage {
  text: string;
  thinking: string;
}

export interface MessagePartRecord {
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
