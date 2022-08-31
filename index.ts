const express = require('express')
const app = express()
import {bundleAndSignData, createData, signers } from "arbundles";
import { writeBundleToArweave } from "./write";
import { txRouter } from "./routes";
const fs = require('fs');
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');

const bundler_wallet_path = process.argv[2];
var privateKey = JSON.parse(fs.readFileSync(bundler_wallet_path))
const signer = new signers.ArweaveSigner(privateKey);
const { Console } = require("console");
const console = new Console({
  stdout: fs.createWriteStream("normalStdout.txt"),
  stderr: fs.createWriteStream("errStdErr.txt"),
});


app.use(express.raw({limit:"100mb"}))
app.use(txRouter)
// initialize queue as a global variable
app.locals.queue = [];

const scheduler = new ToadScheduler();
const BUNDLE_SIZE = 1000;

const task = new Task('bundle n send', () => bundleTxnsAndSend());
const job = new SimpleIntervalJob({ seconds: 5 }, task);

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
  const bundles = [];
  while (!(app.locals.queue.length==0)) {
    	console.log("found items in bundle queue! ");
	bundles.push(app.locals.queue.splice(0,BUNDLE_SIZE));
  }

  bundles.forEach(async (listOfDataItems) => {
    const bundledTxn = await bundleAndSignData(listOfDataItems, signer);
    console.log(bundledTxn);
    console.log(bundledTxn.get(0));
    console.log(bundledTxn.get(0).id); 
    const verified = await bundledTxn.verify();
    console.log("verified =", verified);
    if (verified) {
    	await writeBundleToArweave(bundledTxn.getRaw(), privateKey);
    } else { 
    	console.log("did not post bundle because it was not verified");
    }
  })
}



console.log("Listening on port 3000");

app.listen(3000)
