import AWS from 'aws-sdk';

const queueUrl = process.env.SQS_EXPORT_BUNDLES_URL!;

interface ExportBundles {
  jobId: string;
}

const sqs = new AWS.SQS({
  maxRetries: 3,
  httpOptions: { timeout: 5000, connectTimeout: 5000 },
});

export async function enqueueExportBundles(params: ExportBundles) {
  await sqs
    .sendMessage({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(params),
    })
    .promise();
}
