import Arweave from 'arweave/node/index.js';
import { DataItem, bundleAndSignData, createData, signers } from 'arbundles';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import https from 'https';
import rimraf from 'rimraf';
import { Consumer } from 'sqs-consumer';
import log from './logger.js';

const fsPromises = fs.promises;

const jobsFolder = '/data-items/jobs';

const arweaveClient = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

arweaveClient.api.config.timeout = 1000 * 60 * 1.5;

const awsSM = new AWS.SecretsManager({
  region: 'us-east-1',
});

let privateKey: any;
let signer: any;

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

// app.on('empty', () => {
//   log.info('[SQS] QUEUE EMPTY!');
// });

async function messageHandler(message: any) {
  let jobId: string;

  try {
    jobId = JSON.parse(message.Body)['jobId'];
  } catch (error) {
    log.error(error);
  }

  if (!jobId) {
    throw new Error("Couldn't retrieve jobId from message");
  }

  const currentJobFolder = path.join(jobsFolder, jobId);

  if (!fs.existsSync(currentJobFolder)) {
    throw new Error(`path currentJobFolder: ${currentJobFolder} doesn't exist`);
  }

  const unbundledFiles_ = await fsPromises.readdir(currentJobFolder);
  const unbundledFiles = unbundledFiles_
    .filter((filename) => filename.endsWith('.raw'))
    .sort();

  const listOfDataItems_ = await Promise.all(
    unbundledFiles.map((filename: string) =>
      fsPromises.readFile(path.join(currentJobFolder, filename)),
    ),
  );

  const listOfDataItems = listOfDataItems_.map(
    (buffer: Buffer) => new DataItem(buffer),
  );

  const bundledTx = await bundleAndSignData(listOfDataItems, signer);

  const tx = await arweaveClient.createTransaction(
    { data: bundledTx.getRaw() },
    privateKey,
  );

  tx.addTag('Bundle-Format', 'binary');
  tx.addTag('Bundle-Version', '2.0.0');
  tx.addTag('Content-Type', 'application/octet-stream');

  await arweaveClient.transactions.sign(tx, privateKey);

  const txId = tx.id;

  log.info('🚀 ~ writeBundleToArweave ~ signed', { txId });
  await fsPromises.writeFile(path.join(currentJobFolder, 'txid.txt'), txId);

  const uploader = await arweaveClient.transactions.getUploader(tx);

  while (!uploader.isComplete) {
    await uploader.uploadChunk();
    log.info(
      `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`,
      { txId },
    );
  }

  log.info('upload done!', { txId });
}

(async () => {
  log.info('Starting export-bundles...');
  const sdata = await awsSM
    .getSecretValue({ SecretId: 'bundler/wallet' })
    .promise();

  privateKey = JSON.parse(sdata.SecretString);
  signer = new signers.ArweaveSigner(privateKey);

  app.start();
})();
