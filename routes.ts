import express from 'express';
import { checkAndHoldBalance } from './currencies';

const router = express.Router();


router.post(
  '/tx/:currency',
  function(req, res) {
  // TODO: remove This log
  console.log("REQUEST RECEIVED!");
  // Get currency from request parameter
  console.log("queue status = ", req.app.locals.queue);
  const currency = req.params.currency;
  // check if currency stored with bundlr is sufficient
  const dataItem = req.body;
  console.log(dataItem);
  const sufficient = checkAndHoldBalance(currency, dataItem);
  if (sufficient) {
    // if sufficient add to bundling queue
    // TODO: remove logging statement
    console.log(dataItem);
    req.app.locals.queue.push(dataItem);
    res.sendStatus(200);
  } else {
    // log something if not sufficient balance
    console.log(dataItem.txid, " failed because of insufficient funds with bundlr");
    // respond with status code that indicates insufficient payment
    res.sendStatus(402);
  }
});

export { router as txRouter };
