import Arweave from "arweave/node";

// const arweaveClient = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
const arweaveClient = Arweave.init({ host: 'localhost', port: 1984, protocol: 'http' });

arweaveClient.api.config.timeout = 1000 * 60 * 1.5;

const writeBundleToArweave = async (bundle: Buffer, privateKey, tags?: Array<any>) => {
    try {
        const tx = await arweaveClient.createTransaction({ data: bundle }, privateKey)
        tx.addTag("Bundle-Format", "binary")
        tx.addTag("Bundle-Version", "2.0.0")
        tx.addTag("Content-Type", "application/octet-stream")

        tags?.forEach(tag => {
            tx.addTag(tag.name, tag.value)
        })
        await arweaveClient.transactions.sign(tx, privateKey)
        console.log("🚀 ~ writeBundleToArweave ~ signed", tx.id)
        let uploader = await arweaveClient.transactions.getUploader(tx);
	console.log(uploader);
        while (!uploader.isComplete) {
            await uploader.uploadChunk();
            console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
        }
        console.log(`Bundle is posted and will be mined shortly. Check status at https://viewblock.io/arweave/tx/${tx.id}`);
        return tx.id
    }
    catch (err) {
        console.log('Error, bundle not posted')
        console.log(JSON.stringify(err))
        return null
    }
}

export { writeBundleToArweave };
