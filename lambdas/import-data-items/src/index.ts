import fs from 'fs';
import { enqueue, getQueueUrl, createQueueHandler } from './queues.js';
import log from './logger.js';

interface ImportDataItem {
  efsDataPath: string;
  dataItemId: string;
}

export const handler = createQueueHandler<ImportDataItem>(
  getQueueUrl('import-data-items'),
  async ({ efsDataPath, dataItemId }) => {
    log.info('COOL', { efsDataPath, dataItemId });
    log.info('/mnt/data-items', await fs.promises.readdir('/mnt/data-items'));
  },
  {
    before: async () => {},
    after: async () => {},
  },
);

export default handler;
