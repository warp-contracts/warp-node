const {WarpFactory, defaultCacheOptions, LoggerFactory, defaultWarpGwOptions, LmdbCache} = require("warp-contracts");
const Arweave = require("arweave");

const efsPath = process.env.EFS_PATH;

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

const cacheOptions = {
  ...defaultCacheOptions,
  dbLocation: `${efsPath}/cache/warp/lmdb`
}

const warp = WarpFactory
  .custom(arweave, cacheOptions, 'mainnet', new LmdbCache(cacheOptions))
  .useWarpGateway(defaultWarpGwOptions, defaultCacheOptions)
  .build();


exports.handler = async function (_event, _context) {
  const sns = _event.Records[0]["Sns"];
  const message = JSON.parse(sns.Message);

  logger.info(`Update source`, {
    messageId: sns.MessageId,
    timestamp: sns.Timestamp
  });

  try {
    const contractTxId = message.contractTxId;
    const options = message.evaluationOptions || {};

    logger.info('Updating state for', {
      efsPath,
      contractTxId,
      options,
    });
    if (!isTxIdValid(contractTxId)) {
      logger.error(`${contractTxId} is not a valid tx identifier`);
      return;
    }

    logger.info('Connecting to contract');

    const contract = warp
      .contract(contractTxId)
      .setEvaluationOptions({
        ...options,
        useVM2: true
      });

    logger.info('Reading state', contractTxId);

    const result = await contract.readState();

    logger.debug(`Result for ${contractTxId}`, {
      sortKey: result.sortKey,
      cachedValue: result.cachedValue
    });
    logger.info("Update complete.")
  } catch (e) {
    logger.error(`Error while refreshing contract cache: ${e}.`);
  }
};

function isTxIdValid(txId) {
  const validTxIdRegex = /[a-z0-9_-]{43}/i;
  return validTxIdRegex.test(txId);
}
