import Arweave from 'arweave/node/index.js';
import log from './logger.js';

// const arweaveClient = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
const arweaveClient = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

arweaveClient.api.config.timeout = 1000 * 60 * 1.5;

const writeBundleToArweave = async (
  bundle: Buffer,
  privateKey,
  tags?: Array<any>,
) => {
  try {
    const tx = await arweaveClient.createTransaction(
      { data: bundle },
      privateKey,
    );
    tx.addTag('Bundle-Format', 'binary');
    tx.addTag('Bundle-Version', '2.0.0');
    tx.addTag('Content-Type', 'application/octet-stream');

    tags.forEach((tag) => {
      tx.addTag(tag.name, tag.value);
    });

    await arweaveClient.transactions.sign(tx, privateKey);
    log.info('🚀 ~ writeBundleToArweave ~ signed', tx.id);
    let uploader = await arweaveClient.transactions.getUploader(tx);
    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      log.info(
        `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`,
      );
    }
    log.info(
      `Bundle is posted and will be mined shortly. Check status at https://viewblock.io/arweave/tx/${tx.id}`,
    );
    return tx.id;
  } catch (err) {
    log.error('Error, bundle not posted', err);
    return undefined;
  }
};

export { writeBundleToArweave };
