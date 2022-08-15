import { SQS } from 'aws-sdk';

const queueUrl = process.env.SQS_IMPORT_DATA_ITEMS_URL!;

interface ImportDataItem {
  efsDataPath: string;
  dataItemId: string;
}

const sqs = new SQS({
  maxRetries: 3,
  httpOptions: { timeout: 5000, connectTimeout: 5000 },
});

export async function enqueueDataItem(params: ImportDataItem) {
  await sqs
    .sendMessage({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(params),
    })
    .promise();
}
