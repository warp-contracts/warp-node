const {WarpFactory, defaultCacheOptions, LoggerFactory} = require("warp-contracts");

const efsPath = process.env.EFS_PATH;

LoggerFactory.INST.logLevel('info');
LoggerFactory.INST.logLevel('debug', 'HandlerBasedContract');
const logger = LoggerFactory.INST.create('lambda');

const warp = WarpFactory.forMainnet({
  ...defaultCacheOptions,
  dbLocation: `${efsPath}/cache/warp`
});

exports.handler = async function (_event, _context) {
  // logger.info(JSON.stringify(_event));
  // logger.info(JSON.stringify(_context));
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

    /*const warp = WarpFactory.forMainnet({
      ...defaultCacheOptions,
      dbLocation: `${efsPath}`
    });*/

    const contract = warp
      .contract(contractTxId)
      .setEvaluationOptions(options);

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
