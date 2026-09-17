import { LibSQLStore, ObservabilityLibSQL } from '@mastra/libsql';

ObservabilityLibSQL.prototype.listFeedback = async function () {
  return { feedback: [] };
};

const storage = new LibSQLStore({
    id: 'agent-storage',
    url: 'file:./agents.db',
});

export default storage;