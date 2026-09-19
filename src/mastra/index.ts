import { Mastra } from '@mastra/core/mastra';
import { MastraPlatformExporter, Observability, SensitiveDataFilter } from '@mastra/observability';
import { agent } from './agents/agent';
import memory from './memory';
import { ensureDataSynced } from '../utils/syncData';
import storage from './storage';

await ensureDataSynced();
export const mastra = new Mastra({
  bundler: {
    externals: ['@duckdb/node-bindings'],
  },
  memory: { memory },
  storage: storage,
  agents: { agent },
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [new MastraPlatformExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
