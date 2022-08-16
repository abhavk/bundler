import AWS from 'aws-sdk';
import fs from 'fs';
import log from './logger.js';

const fsPromises = fs.promises;

export async function handler() {
  log.info('Hello cool!!');
  log.info(
    'data-items ready for export',
    await fsPromises.readdir('/mnt/data-items/unbundled'),
  );
}
