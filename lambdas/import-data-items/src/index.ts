import AWS from 'aws-sdk';
import fs from 'fs';
import { DataItem } from 'arbundles';
import { enqueue, getQueueUrl, createQueueHandler } from './queues.js';
import log from './logger.js';

const fsPromises = fs.promises;

interface ImportDataItem {
  efsEntity: string;
  dataItemId: string;
}

export const s3 = new AWS.S3({
  logger: log.info as any,
});

const bucket = process.env.BUNDLER_GATEWAY_BUCKET!;

export const handler = createQueueHandler<ImportDataItem>(
  getQueueUrl('import-data-items'),
  async ({ efsEntity, dataItemId }) => {
    const completedDataPath = '/mnt/data-items/completed/' + efsEntity;
    const unbundledDataPath = '/mnt/data-items/unbundled/' + efsEntity;

    if (!fs.existsSync(completedDataPath)) {
      throw new Error(`Fatal efsDataPath ${completedDataPath} doesn't exist!`);
    }

    const dataItem = new DataItem(await fsPromises.readFile(completedDataPath));

    let contentType = 'application/octet-stream';

    if (dataItem && dataItem.tags && Array.isArray(dataItem.tags)) {
      dataItem.tags.forEach((tag: { name: string; value: string }) => {
        if (tag.name.toLowerCase() === 'content-type') {
          contentType = tag.value;
        }
      });
    }

    await s3
      .upload({
        Key: dataItem.id,
        Bucket: bucket,
        Body: (dataItem as any).rawData,
        ContentType: contentType,
      })
      .promise();

    log.info(`Done uploading ${dataItem.id} to s3`);

    fs.renameSync(completedDataPath, unbundledDataPath);

    log.info(`Done renaming ${completedDataPath} to ${unbundledDataPath}`);
  },
  {
    before: async () => {
      if (!fs.existsSync('/mnt/data-items/unbundled')) {
        await fsPromises.mkdir('/mnt/data-items/unbundled');
      }
    },
    after: async () => {},
  },
);

export default handler;
