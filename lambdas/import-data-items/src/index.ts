import { enqueue, getQueueUrl, createQueueHandler } from './queues.js';
import log from './logger.js';

interface ImportDataItem {
  efsDataPath: string;
  dataItemId: string;
}

export const handler = createQueueHandler<ImportDataItem>(
  getQueueUrl('import-data-items'),
  async ({ header, size }) => {
    log.info('COOL');
  },
  {
    before: async () => {},
    after: async () => {},
  },
);

export default handler;
