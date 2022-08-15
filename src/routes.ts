import express from 'express';
import log from './logger.js';
import { checkAndHoldBalance } from './currencies.js';
import { DataItem } from 'arbundles';

const router = express.Router();

router.post('/tx/:currency', function (req, res) {
  // TODO: remove This log
  log.info('REQUEST RECEIVED!');
  // Get currency from request parameter
  log.info('queue status = ', req.app.locals.queue);
  const currency = req.params.currency;
  log.info('currency used = ' + currency);
  // check if currency stored with bundlr is sufficient
  const dataItem = new DataItem(req.body);
  log.info('dataItem', dataItem);
  dataItem.id = dataItem.id;

  const sufficient = checkAndHoldBalance(currency, dataItem);

  if (sufficient) {
    // if sufficient add to bundling queue
    // TODO: remove logging statement
    req.app.locals.queue.push(dataItem);
    res.status(201).json({ id: dataItem.id });
  } else {
    // log something if not sufficient balance
    log.error(dataItem.id, ' failed because of insufficient funds with bundlr');
    // respond with status code that indicates insufficient payment
    res.sendStatus(402);
  }
});

router.get('/health', function (req, res) {
  res.status(200).send('OK');
});

export { router as txRouter };
