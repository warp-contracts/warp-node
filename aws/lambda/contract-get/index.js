const responder = require('responder');
const {WarpFactory, defaultWarpGwOptions, defaultCacheOptions, LoggerFactory} = require("warp-contracts");
const Arweave = require("arweave");
const {LmdbCache} = require("warp-contracts-lmdb");

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
  try {
    const contractTxId = _event.queryStringParameters.contractTxId;
    const withState = _event.queryStringParameters.state !== 'false';
    const withValidity = _event.queryStringParameters.validity === 'true';
    const withErrorMessage = _event.queryStringParameters.errorMessages === 'true';

    logger.info('Version 1');

    logger.info('Getting state for', {
      efsPath,
      contractTxId
    });
    if (!isTxIdValid(contractTxId)) {
      logger.error(`${contractTxId} is not a valid tx identifier`);
      return;
    }

    logger.info('Connecting to contract', contractTxId);
    const result = await warp.stateEvaluator.latestAvailableState(contractTxId);

    if (result) {
      logger.debug(`Result for ${contractTxId}`, {
        sortKey: result.sortKey,
      });
      logger.info("Get complete.");
      return responder.success({
        sortKey: result.sortKey,
        ...(withState ? { state: result.cachedValue.state } : ''),
        ...(withValidity ? { validity: result.cachedValue.validity } : ''),
        ...(withErrorMessage ? { errorMessages: result.cachedValue.errorMessages } : '')
      });
    } else {
      return responder.internalServerError(`State not available for contract ${contractTxId}`);
    }
  } catch (e) {
    logger.error(`Error while getting contract cache:`, e);
    return responder.internalServerError(e);
  }
};

function isTxIdValid(txId) {
  const validTxIdRegex = /[a-z0-9_-]{43}/i;
  return validTxIdRegex.test(txId);
}
