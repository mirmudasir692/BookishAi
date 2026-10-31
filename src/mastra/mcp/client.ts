import { MCPClient } from '@mastra/mcp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const BUNDLE_PATH = path.join(PROJECT_ROOT, 'bookish_okf');

export const mcpClient = new MCPClient({
  id: 'bookish-okf-client',
  servers: {
    bookish: {
      command: 'okf-mcp',
      args: ['--root', BUNDLE_PATH],
      cwd: PROJECT_ROOT,
    },
  },
});
