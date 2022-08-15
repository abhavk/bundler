import fs from 'fs';
import path from 'path';
import express from 'express';
import { PassThrough } from 'stream';
import { DataItem } from 'arbundles';
import { uuid } from 'uuidv4';
import log from './logger.js';
import { checkAndHoldBalance } from './currencies.js';
import { enqueueDataItem } from './sqs.js';

const router = express.Router();

router.post('/tx/:currency', function (req, res) {
  log.info('REQUEST RECEIVED!');
  const currency = req.params.currency;
  log.info('currency used = ' + currency);

  const tmpDataName = Date.now().toString() + uuid() + '.raw';
  const tmpDataPath = path.join('/data-items/incomplete/', tmpDataName);
  const doneDataPath = path.join('/data-items/completed/', tmpDataName);

  const stream = new PassThrough();

  const inMemoryChunks = [];
  const writeStream = fs.createWriteStream(tmpDataPath);
  stream.pipe(writeStream);
  req.pipe(stream);

  stream.on('data', (chunk) => {
    inMemoryChunks.push(chunk);
  });

  req.on('end', () => {
    log.info(
      'Request pipe ended successfully, moving on to dataItem validation',
    );

    let dataItem: any;

    try {
      dataItem = new DataItem(Buffer.concat(inMemoryChunks));
    } catch (error) {
      log.error('Error creating dataItem', error);
    }

    if (dataItem) {
      const sufficient = checkAndHoldBalance(currency, dataItem);
      if (sufficient) {
        log.info('Sufficient balance!', { currency, dataItemId: dataItem.id });

        fs.renameSync(tmpDataPath, doneDataPath);
        await enqueueDataItem({
          efsDataPath: doneDataPath,
          dataItemId: dataItem.id,
        });
        res.status(201).json({ id: dataItem.id });
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
});

router.get('/health', function (req, res) {
  res.status(200).send('OK');
});

export { router as txRouter };
