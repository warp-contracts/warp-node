const {expose} = require("threads/worker");
const {knex} = require("knex");
const {LoggerFactory, SmartWeaveNodeFactory} = require("redstone-smartweave");
const {initArweave} = require("../arweave");

console.log("creating new thread");

const arweave = initArweave(true);
let sdk;

expose(async function fetchContract(contractTxId, testnet, blockHeight, millis) {
    if (!sdk) {
        console.log("creating sdk instance");
      sdk = SmartWeaveNodeFactory.memCached(arweave, 1)
    }
    //const arweave = initArweave(testnet);
    /*const knexConfig = knex({
        client: 'sqlite3',
        connection: {
            filename: `./src/node/.db/contracts.sqlite`
        },
        useNullAsDefault: true
    });*/
    // TODO: how to share sdk instance..?
    LoggerFactory.INST.logLevel("error");
    //const sdk = await SmartWeaveNodeFactory.knexCached(arweave, knexConfig, 1);
    console.log(`Evaluating contract ${contractTxId} state as height ${blockHeight}.`);
    try {
        const result = await sdk.contract(contractTxId)
            .setEvaluationOptions({
                manualCacheFlush: true,
                useVM2: true,
                useFastCopy: true
            })
            .readState(blockHeight);
        return result;
    } catch(e) {
        console.error(e);
    }
});