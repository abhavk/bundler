import express from 'express';
import { checkAndHoldBalance } from './currencies';
import { DataItem } from "arbundles";
const router = express.Router();
const { Console } = require("console");
const fs = require("fs");
const bundlelogger = new Console({
  stdout: fs.createWriteStream("normalStdout.txt"),
  stderr: fs.createWriteStream("errStdErr.txt"),
});

router.post(
  '/tx/:currency',
  async function(req, res) {
  // TODO: remove This log
  console.log("REQUEST RECEIVED!");
  // Get currency from request parameter
  console.log("queue status = ", req.app.locals.queue);
  const currency = req.params.currency;
  console.log("currency used = ", currency);
  // check if currency stored with bundlr is sufficient
  const dataItem:any = new DataItem(req.body);
  console.log(dataItem);
  const validItem = await DataItem.verify(dataItem.binary);
  if (validItem) {
	console.log("Item VALID!")
  } else {
  	res.sendStatus(400);
	console.log("Item INVALID!");
	return;
  }
  dataItem.id = dataItem.id;
  const sufficient = checkAndHoldBalance(currency, dataItem);
  if (sufficient) {
    // if sufficient add to bundling queue
    // TODO: remove logging statement
    req.app.locals.queue.push(dataItem);
    res.status(201).json({ id: dataItem.id });
  } else {
    // log something if not sufficient balance
    console.log(dataItem.id, " failed because of insufficient funds with bundlr");
    // respond with status code that indicates insufficient payment
    res.sendStatus(402);
  }
});

export { router as txRouter };
