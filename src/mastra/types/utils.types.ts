export interface ProgressState {
  currentIndex: number;
}

export interface IncomingFile {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

export interface StoredFile {
  filename: string;
  key: string;
  contentType: string;
  size?: number;
}
