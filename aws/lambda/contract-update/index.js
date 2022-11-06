const {WarpFactory, defaultCacheOptions, LoggerFactory, defaultWarpGwOptions} = require("warp-contracts");
const Arweave = require("arweave");
const {initPubSub, publish} = require("warp-contracts-pubsub");
const {LmdbCache} = require("warp-contracts-lmdb");

initPubSub();

const efsPath = process.env.EFS_PATH;
const authTokenAppSync = process.env.AUTH_TOKEN;

LoggerFactory.INST.logLevel('info');
LoggerFactory.INST.logLevel('debug', 'HandlerBasedContract');
const logger = LoggerFactory.INST.create('l-update');

const byteSize = str => new Blob([str]).size;

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443, // Port
  protocol: 'https', // Network protocol http or https
  timeout: 60000, // Network request timeouts in milliseconds
  logging: false // Enable network request logging
});

const cacheOptions = {
  ...defaultCacheOptions,
  dbLocation: `${efsPath}/cache/warp/lmdb-2`
}

const warp = WarpFactory
  .custom(arweave, cacheOptions, 'mainnet', new LmdbCache({
    ...cacheOptions,
    dbLocation: `${efsPath}/cache/warp/lmdb-2/contracts`
  }))
  .useWarpGateway(defaultWarpGwOptions, defaultCacheOptions,)
  .build();


exports.handler = async function (_event, _context) {
  const contractTxId = _event.queryStringParameters.contractTxId;

  try {
    logger.info('Updating state for', {
      efsPath,
      contractTxId,
    });
    if (!isTxIdValid(contractTxId)) {
      logger.error(`${contractTxId} is not a valid tx identifier`);
      return;
    }

    logger.info('Connecting to contract');

    const contract = warp
      .contract(contractTxId)
      .setEvaluationOptions({
        allowBigInt: true,
        useVM2: true
      });

    logger.info('Reading state', contractTxId);

    const result = await contract.readState();

    const stateAsString = JSON.stringify(result.cachedValue.state);
    const stateSize = byteSize(stateAsString);

    const pubMessage = {
      contractTxId,
      stateSize,
      sortKey: result.sortKey,
      timestamp: new Date().getTime()
    };
    if (stateSize < 950_000) {
      pubMessage.state = result.cachedValue.state;
    }

    const publishResult = await publish(contractTxId, JSON.stringify(pubMessage), authTokenAppSync);
    logger.debug(`Result for ${contractTxId}`, {
      sortKey: result.sortKey,
      publishResult
    });
    logger.info("Update complete.")
  } catch (e) {
    logger.error(`Error while refreshing contract cache`, e);
  }
};

function isTxIdValid(txId) {
  const validTxIdRegex = /[a-z0-9_-]{43}/i;
  return validTxIdRegex.test(txId);
}
