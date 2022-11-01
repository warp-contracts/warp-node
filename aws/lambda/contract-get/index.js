const responder = require('responder');
const {WarpFactory, defaultWarpGwOptions, defaultCacheOptions, LmdbCache, LoggerFactory} = require("warp-contracts");
const Arweave = require("arweave");

const efsPath = process.env.EFS_PATH;

LoggerFactory.INST.logLevel('info');
LoggerFactory.INST.logLevel('debug', 'CacheableStateEvaluator');
const logger = LoggerFactory.INST.create('l-get');

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443, // Port
  protocol: 'https', // Network protocol http or https
  timeout: 60000, // Network request timeouts in milliseconds
  logging: false // Enable network request logging
});

const cacheOptions = {
  ...defaultCacheOptions,
  dbLocation: `${efsPath}/cache/warp/lmdb`
}

const warp = WarpFactory
  .custom(arweave, cacheOptions, 'mainnet', new LmdbCache(cacheOptions))
  .useWarpGateway(defaultWarpGwOptions, defaultCacheOptions)
  .build();

exports.handler = async function (_event, _context) {
  // logger.info(JSON.stringify(_event));
  //  logger.info(JSON.stringify(_context));
  logger.info(`Get source`, _context);

  try {
    const contractTxId = _event.queryStringParameters.contractTxId;

    logger.info('Getting state for', {
      efsPath,
      contractTxId
    });
    if (!isTxIdValid(contractTxId)) {
      logger.error(`${contractTxId} is not a valid tx identifier`);
      return;
    }

    logger.info('Connecting to contract');
    const result = await getState(contractTxId);

    logger.debug(`Result for ${contractTxId}`, {
      sortKey: result.sortKey,
      cachedValue: result.cachedValue
    });
    logger.info("Get complete.");

    return responder.success(result);
  } catch (e) {
    logger.error(`Error while getting contract cache: ${e}.`);
    return responder.internalServerError(e);
  }
};

async function getState(contractTxId) {
  return await warp.stateEvaluator.latestAvailableState(contractTxId);
}

function isTxIdValid(txId) {
  const validTxIdRegex = /[a-z0-9_-]{43}/i;
  return validTxIdRegex.test(txId);
}
