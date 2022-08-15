import AWS from 'aws-sdk';
import fs from 'fs';
import express from 'express';
import log from './logger.js';
import { bundleAndSignData, createData, signers } from 'arbundles';
import { writeBundleToArweave } from './write.js';
import { txRouter } from './routes.js';
import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';

const fsPromises = fs.promises;

const awsSM = new AWS.SecretsManager({
  region: 'us-east-1',
});

let signer: any;
let privateKey: any;

const app = express();

app.use(express.raw({ limit: '100mb' }));
app.use(txRouter);
// initialize queue as a global variable
app.locals.queue = [];

const scheduler = new ToadScheduler();
const BUNDLE_SIZE = 1000;

const task = new Task('bundle n send', () => bundleTxnsAndSend());
const job = new SimpleIntervalJob({ seconds: 5 }, task);

scheduler.addSimpleIntervalJob(job);

async function bundleTxnsAndSend() {
  log.info('running scheduled bundlensend with queue = ', app.locals.queue);
  const bundles = [];

  while (app.locals.queue.length > 0) {
    bundles.push(app.locals.queue.splice(0, BUNDLE_SIZE));
  }

  for (const listOfDataItems of bundles) {
    const bundledTxn = await bundleAndSignData(listOfDataItems, signer);
    log.info('new bundled tx', bundledTxn);

    const verified = await bundledTxn.verify();
    log.info(`verified = ${verified}`);
    if (verified) {
      await writeBundleToArweave(bundledTxn.getRaw(), privateKey);
    } else {
      log.warn('did not post bundle because it was not verified');
    }
  }
}

async function start() {
  log.info('starting bundler instance...');

  await fsPromises.writeFile('/data-root/whereami.txt', 'hello world!');

  const sdata = await awsSM
    .getSecretValue({ SecretId: 'bundler/wallet' })
    .promise();

  privateKey = JSON.parse(sdata.SecretString);

  log.info('making a signer object');
  signer = new signers.ArweaveSigner(privateKey);
  log.info('start sequence done');
}

start().then(() => {
  log.info('Listening on port 3000');

  app.listen(3000);
});
