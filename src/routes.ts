import fs from 'fs';
import path from 'path';
import express from 'express';
import { DataItem } from 'arbundles';
import { uuid } from 'uuidv4';
import log from './logger.js';
import { checkAndHoldBalance } from './currencies.js';

const router = express.Router();

router.post('/tx/:currency', function (req, res) {
  // TODO: remove This log
  log.info('REQUEST RECEIVED!');
  // Get currency from request parameter
  log.info('queue status = ', req.app.locals.queue);
  const currency = req.params.currency;
  log.info('currency used = ' + currency);
  // check if currency stored with bundlr is sufficient
  // const dataItem = new DataItem(req.body);
  // log.info('dataItem', dataItem);
  // dataItem.id = dataItem.id;

  // const sufficient = checkAndHoldBalance(currency, dataItem);

  const tmpDataName = Date.now().toString() + uuid() + '.raw';
  const tmpDataPath = path.join('/data-items/incomplete/', tmpDataName);
  const doneDataPath = path.join('/data-items/completed/', tmpDataName);

  req.pipe(fs.createWriteStream(tmpDataPath));

  req.on('end', () => {
    log.info(
      'Request pipe ended successfully, moving on to dataItem validation',
    );

    let dataItem: any;

    try {
      dataItem = new DataItem(fs.readFileSync(tmpDataPath));
    } catch (error: any) {
      log.error('Error creating dataItem', error);
    }

    if (dataItem) {
      const sufficient = checkAndHoldBalance(currency, dataItem);
      if (sufficient) {
        log.info('Sufficient balance!', { currency, dataItemId: dataItem.id });

        fs.renameSync(tmpDataPath, doneDataPath);
        res.status(200).send('Upload complete');
      } else {
        log.warn('Insufficient balance!', {
          currency,
          dataItemId: dataItem.id,
        });
        res.sendStatus(402);
        fs.unlinkSync(tmpDataPath);
      }
    } else {
      res.sendStatus(500);
      fs.unlinkSync(tmpDataPath);
    }
  });

  req.on('error', () => {
    log.error(`Broken pipe or error while streaming upload to filesystem`, {
      tmpDataPath,
    });
    res.sendStatus(500);
    fs.unlinkSync(tmpDataPath);
  });

  // if (sufficient) {
  //   // if sufficient add to bundling queue
  //   // TODO: remove logging statement
  //   req.app.locals.queue.push(dataItem);
  // } else {
  //   // log something if not sufficient balance
  //   log.error(dataItem.id, ' failed because of insufficient funds with bundlr');
  //   // respond with status code that indicates insufficient payment
  //   res.sendStatus(402);
  // }
});

router.get('/health', function (req, res) {
  res.status(200).send('OK');
});

export { router as txRouter };
