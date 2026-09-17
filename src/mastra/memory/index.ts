import { Memory } from '@mastra/memory';
import { embeddingModel } from '../config/config';

const memory = new Memory({
  embedder: embeddingModel as any,
});
export default memory;
