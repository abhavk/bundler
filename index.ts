const express = require('express')
const app = express()
import { bundleAndSignData, createData, signers } from "arbundles";
import { writeBundleToArweave } from "./write";
import { txRouter } from "./routes";
const fs = require('fs');
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');

const bundler_wallet_path = process.argv[2];
var privateKey = JSON.parse(fs.readFileSync(bundler_wallet_path))
const signer = new signers.ArweaveSigner(privateKey);

app.use(txRouter)

// initialize queue as a global variable
app.locals.queue = [];

const scheduler = new ToadScheduler();
const BUNDLE_SIZE = 1000;

const task = new Task('bundle n send', () => bundleTxnsAndSend());
const job = new SimpleIntervalJob({ seconds: 2, }, task);

scheduler.addSimpleIntervalJob(job)



// POST transaction
/* This creates a single DataItem from input transaction data and tags
   @request: {
    data: String | Uint8Array,
    tags?: [{
    name: string,
    value: string
    }]
 }
*/
// app.post('/tx', function(req, res) {
//   const dataItem = req.body.tags? createData(req.body.data, signer, req.body.tags) : createData(req.body.data, signer);
//   console.log(dataItem);
//   queue.push(dataItem);
//   res.sendStatus(200);
// });

// app.get('/', function (req, res) {
//   res.send('Hello World')
// });

function bundleTxnsAndSend() {
  console.log("running scheduled bundlensend with queue = ", app.locals.queue);
  const bundles = [];
  while (!(app.locals.queue.length==0)) {
    bundles.push(app.locals.queue.splice(0,BUNDLE_SIZE));
  }

  bundles.forEach(async (bundle) => {
    const bundledTxn = await bundleAndSignData(bundle, signer);
    console.log(bundledTxn);
    console.log(bundledTxn.get(0));
    console.log(bundledTxn.get(0).id);

    await writeBundleToArweave(bundledTxn.getRaw(), privateKey);
  })
}



console.log("Listening on port 3000");

app.listen(3000)
