const responder = require('responder');
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

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443, // Port
  protocol: 'https', // Network protocol http or https
  timeout: 60000, // Network request timeouts in milliseconds
  logging: false // Enable network request logging
});

const warp = WarpFactory
  .custom(arweave, defaultCacheOptions, 'mainnet', new LmdbCache({
    ...defaultCacheOptions,
    dbLocation: `${efsPath}/cache/warp/lmdb-5/state`
  }))
  .useWarpGateway(defaultWarpGwOptions, defaultCacheOptions, new LmdbCache({
    ...defaultCacheOptions,
    dbLocation: `${efsPath}/cache/warp/lmdb-5/contracts`
  }))
  .build();

exports.handler = async function (_event, _context) {
  const contractTxId = _event.queryStringParameters.contractTxId;
  const refresh = _event.queryStringParameters.refresh === 'true';

  try {
    if (refresh) {
      logger.info('Refreshing cache');
      await warp.stateEvaluator.latestAvailableState(contractTxId);
      return responder.success(`Cache refreshed.`);
    }

    logger.info('Updating state for', {
      contractTxId
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
    logger.debug(`Result for ${contractTxId}`, {
      sortKey: result.sortKey
    });

    const stateAsString = JSON.stringify(result.cachedValue.state);
    const stateSize = Buffer.byteLength(stateAsString, "utf-8");

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
    logger.info("Message published.");

    logger.info("Update complete.");

    return responder.success(`Contract ${contractTxId} updated.`);
  } catch (e) {
    logger.error(`Error while refreshing contract cache`, e);
    return responder.internalServerError(e);
  }
};

function isTxIdValid(txId) {
  const validTxIdRegex = /[a-z0-9_-]{43}/i;
  return validTxIdRegex.test(txId);
}
