import AWS from 'aws-sdk';
import fs from 'fs';
import https from 'https';
import { Consumer } from 'sqs-consumer';
import log from './logger.js';

const fsPromises = fs.promises;

const awsSM = new AWS.SecretsManager({
  region: 'us-east-1',
});

let privateKey: any;

const app = Consumer.create({
  queueUrl: process.env.SQS_EXPORT_BUNDLES_URL!,
  // pollingWaitTimeMs: 60 * 1000,
  pollingWaitTimeMs: 1000, // TODO deleteme before golive
  batchSize: 1,
  handleMessage: messageHandler,
  sqs: new AWS.SQS({
    httpOptions: {
      agent: new https.Agent({
        keepAlive: true,
      }),
    },
  }),
});

app.on('error', (err, message) => {
  log.error(`[SQS] ERROR EVENT`, { err, message });
});

app.on('processing_error', (err, message) => {
  log.error(`[SQS] PROCESSING ERROR EVENT`, { err, message });
});

app.on('message_received', (message) => {
  log.info('[SQS] Message received', { message });
});

app.on('message_processed', (message) => {
  log.info(`[SQS] Message processed`, { message });
});

app.on('stopped', () => {
  log.error('[SQS] CONSUMER STOPPED!');
});

app.on('empty', () => {
  log.info('[SQS] QUEUE EMPTY!');
});

async function messageHandler() {}

(async () => {
  log.info('Starting export-bundles...');
  const sdata = await awsSM
    .getSecretValue({ SecretId: 'bundler/wallet' })
    .promise();

  privateKey = JSON.parse(sdata.SecretString);

  app.start();
})();
