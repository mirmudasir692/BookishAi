import { Mastra } from '@mastra/core/mastra';
import {
  MastraStorageExporter,
  MastraPlatformExporter,
  Observability,
  SensitiveDataFilter,
} from '@mastra/observability';
import { agent } from './agents/agent';
import memory from './memory';
import { ensureDataSynced } from '../utils/syncData';

await ensureDataSynced();
export const mastra = new Mastra({
  bundler: {
    externals: ['@duckdb/node-bindings'],
  },
  memory: { memory },

  agents: { agent },
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
