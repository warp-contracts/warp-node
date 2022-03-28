import * as path from "path";
import {Knex} from "knex";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import nodeRouter from "./nodeRouter";
import {LoggerFactory, RedStoneLogger, SmartWeave,} from "redstone-smartweave";
import {TsLogFactory} from "redstone-smartweave/lib/cjs/logging/node/TsLogFactory";
import {initArweave} from "./arweave";
import Arweave from "arweave";
import * as os from "os";
import {JWKInterface} from "arweave/node/lib/wallet";
import * as fs from "fs";
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers'
import {connectSdk} from "./connectSdk";
import {NetworkContractService} from "./components/NetworkContractService";
import {ExecutionNode} from "./components/ExecutionNode";
import {addExitCallback} from "catch-exit";
import {Snowball} from "./components/Snowball";

require("dotenv").config();

declare module "koa" {
  interface BaseContext {
    db: Knex;
    gatewayDb: Knex;
    sdk: SmartWeave;
    logger: RedStoneLogger;
    node: ExecutionNode;
    networkContract: NetworkContractService;
    network: string;
    arweave: Arweave;
    port: number;
    testnet: boolean;
    snowball: Snowball;
  }
}

const argv = yargs(hideBin(process.argv)).parseSync();

(async () => {
  const url = argv.url as string;
  const port = (argv.port || 5777) as number;
  const address = `${argv.url}:${port}`;
  const testnet = (argv.testnet || "true") == "true";
  const networkId = argv.networkId as string;
  const networkContractId = argv.networkContractId as string;

  const dbPath = path.join(__dirname, '.db');
  const arweave = initArweave(testnet);
  const wallet = readWallet();
  const jwkAddress = await arweave.wallets.getAddress(wallet);
  const nodeId = `${os.hostname()}_${port}_${jwkAddress}`;

  LoggerFactory.use(new TsLogFactory());
  LoggerFactory.INST.setOptions({
    displayInstanceName: true,
    instanceName: port,
  });
  LoggerFactory.INST.logLevel("error");
  LoggerFactory.INST.logLevel("debug", "node");
  LoggerFactory.INST.logLevel("debug", "ExecutionNode");
  LoggerFactory.INST.logLevel("debug", "NetworkContractService");
  LoggerFactory.INST.logLevel("debug", "⛄");
  const logger = LoggerFactory.INST.create("node");

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath);
  }
  const {sdk, contract, db} = await connectSdk(
    arweave,
    dbPath,
    testnet,
    networkContractId,
    wallet);

  const networkContract = new NetworkContractService(contract, sdk, testnet);
  const nodeData = {
    nodeId,
    owner: jwkAddress,
    url,
    port,
    address,
    networkId,
    testnet,
    networkContractId,
    wallet
  };
  const node = new ExecutionNode(nodeData, sdk, networkContract, arweave);
  const consensusParams = await networkContract.consensusParams(node.nodeData);
  const snowball = new Snowball(consensusParams);

  const app = new Koa();

  app.context.db = db;
  app.context.arweave = arweave;
  app.context.sdk = sdk;
  app.context.logger = logger;
  app.context.node = node;
  app.context.networkContract = networkContract;
  app.context.snowball = snowball;
  app.use(bodyParser());
  app.use(nodeRouter.routes());
  app.listen(port);

  try {
    await node.registerInNetwork();
  } catch (e) {
    logger.error(e);
    await node.disconnectFromNetwork();
    await node.registerInNetwork();
  }

  addExitCallback((signal) => {
    // TODO: this does not work for async calls
    if (signal !== 'exit') {
      new Promise((resolve) => {
        node.disconnectFromNetwork().then(function () {
          resolve(null);
        });
      });
    }
  });
})();

function readWallet(): JWKInterface {
  const json = fs.readFileSync(path.join(__dirname, '.secrets', 'testnet-wallet.json'), "utf-8");
  return JSON.parse(json);
}
