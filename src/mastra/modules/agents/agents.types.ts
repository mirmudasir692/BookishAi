import { IncomingFile } from 'src/mastra/types/utils.types';

export interface ChatStreamInputOptions {
  files?: IncomingFile[];
}

export interface ExtractedMulterFile {
  filename: string;
  contentType: string;
  buffer: Buffer;
}
