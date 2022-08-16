import AWS from 'aws-sdk';

const queueUrl = process.env.SQS_IMPORT_DATA_ITEMS_URL!;

interface ImportDataItem {
  efsEntity: string;
  dataItemId: string;
}

const sqs = new AWS.SQS({
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
