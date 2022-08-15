import fs from 'fs';
import express from 'express';
import { bundleAndSignData, createData, signers } from 'arbundles';
import { writeBundleToArweave } from './write.js';
import { txRouter } from './routes.js';
import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';

const bundler_wallet_path = process.argv[2];
const privateKey =
  JSON.parse(fs.readFileSync(bundler_wallet_path).toString()) || {};

const signer = new signers.ArweaveSigner(privateKey);

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
  console.log('running scheduled bundlensend with queue = ', app.locals.queue);
  const bundles = [];

  while (app.locals.queue.length > 0) {
    bundles.push(app.locals.queue.splice(0, BUNDLE_SIZE));
  }

  for (const listOfDataItems of bundles) {
    const bundledTxn = await bundleAndSignData(listOfDataItems, signer);
    console.log(bundledTxn);
    console.log(bundledTxn.get(0));
    console.log(bundledTxn.get(0).id);
    const verified = await bundledTxn.verify();
    console.log('verified =', verified);
    if (verified) {
      await writeBundleToArweave(bundledTxn.getRaw(), privateKey);
    } else {
      console.log('did not post bundle because it was not verified');
    }
  }
}

console.log('Listening on port 3000');

app.listen(3000);
