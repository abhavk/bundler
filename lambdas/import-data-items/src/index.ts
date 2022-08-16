import fs from 'fs';
import { DataItem } from 'arbundles';
import { enqueue, getQueueUrl, createQueueHandler } from './queues.js';
import log from './logger.js';

interface ImportDataItem {
  efsDataPath: string;
  dataItemId: string;
}

export const handler = createQueueHandler<ImportDataItem>(
  getQueueUrl('import-data-items'),
  async ({ efsDataPath, dataItemId }) => {
    const lambdaDataPath = '/mnt' + efsDataPath;

    if (!fs.existsSync(lambdaDataPath)) {
      throw new Error(`Fatal efsDataPath ${lambdaDataPath} doesn't exist!`);
    }

    log.info('COOL', { efsDataPath, dataItemId });
    log.info('/mnt/data-items', await fs.promises.readdir('/mnt/data-items'));

    const dataItem = new DataItem(await fs.promises.readFile(lambdaDataPath));

    log.info('THE TAGS', dataItem.tags);
    log.info('THE KEYS', Object.keys(dataItem));
    log.info('THE DATA ITEM', dataItem);
  },
  {
    before: async () => {},
    after: async () => {},
  },
);

export default handler;
