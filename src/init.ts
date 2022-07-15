import * as path from "path";
import Koa from "koa";
import Application from "koa";
import bodyParser from "koa-bodyparser";
import nodeRouter from "./nodeRouter";
import {ArweaveWrapper, LoggerFactory, Warp, WarpLogger} from "warp-contracts";
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
import {Snowball} from "./components/Snowball";
import {runNetworkInfoCacheTask} from "./tasks/networkInfoCache";
import {runOtherPeersTask} from "./tasks/otherPeersCache";
import {runConsensusParamsTask} from "./tasks/consensusParamsCache";
import {runContractsTask} from "./tasks/contractsCache";
import {createBalancesDbTables} from "./balancesDb";
import {Knex} from "knex";

require("dotenv").config();

const pjson = require('./../package.json');
const cors = require('@koa/cors');
const knex = require('knex');

export interface NodeContext {
  contractsSdk: Warp;
  logger: WarpLogger;
  node: ExecutionNode;
  networkContract: NetworkContractService;
  network: string;
  arweave: Arweave;
  port: number;
  testnet: boolean;
  snowball: Snowball;
  arweaveWrapper: ArweaveWrapper;
  balancesDb: Knex;
}

const argv = yargs(hideBin(process.argv)).parseSync();

(async () => {
  const url = argv.url as string;
  const port = (argv.port || 5777) as number;
  const address = `${argv.url}:${port}`;
  const testnet = (argv.testnet || "true") == "true";
  const networkId = argv.networkId as string;
  const networkContractId = argv.networkContractId as string;

  const denContractCachePath = path.join(__dirname, 'den-data',port.toString(), 'cache', 'den');
  const contractsCachePath = path.join(__dirname, 'den-data', port.toString(), 'cache', 'contracts');
  const balancesDbPath = path.join(__dirname, port.toString(), 'balancesDb');
  const arweave = initArweave(testnet);
  const wallet = readWallet();
  const jwkAddress = await arweave.wallets.getAddress(wallet);
  const nodeId = `${os.hostname()}_${port}_${jwkAddress}`;
  const nodeVersion = pjson.version;

  LoggerFactory.INST.setOptions({
    displayInstanceName: true,
    instanceName: port,
  });
  LoggerFactory.INST.logLevel("fatal");
  LoggerFactory.INST.logLevel("fatal", "WASM:AS");
  LoggerFactory.INST.logLevel("debug", "node");
  LoggerFactory.INST.logLevel("debug", "ExecutionNode");
  LoggerFactory.INST.logLevel("debug", "NetworkContractService");
  LoggerFactory.INST.logLevel("debug", "Snowball");
  LoggerFactory.INST.logLevel("fatal", "HandlerBasedContract");
  LoggerFactory.INST.logLevel("fatal", "DefaultStateEvaluator");
  const logger = LoggerFactory.INST.create("node");

  process
    .on('unhandledRejection', (reason, p) => {
      logger.error('Unhandled Rejection at Promise', reason);
    })
    .on('uncaughtException', err => {
      logger.error('Uncaught Exception thrown', err);
      process.exit(0);
    });

  if (!fs.existsSync(denContractCachePath)) {
    fs.mkdirSync(denContractCachePath, {recursive: true});
  }
  if (!fs.existsSync(contractsCachePath)) {
    fs.mkdirSync(contractsCachePath, {recursive: true});
  }
  if (!fs.existsSync(balancesDbPath)) {
    fs.mkdirSync(balancesDbPath, {recursive: true});
  }

  const denSdk = await connectSdk(arweave, denContractCachePath, testnet);
  const contractsSdk = await connectSdk(arweave, contractsCachePath, testnet);
  const denContract = denSdk.contract<any>(networkContractId).connect(wallet);

  const balancesDb = knex({
    client: 'better-sqlite3',
    connection: {
      filename: `${balancesDbPath}/balances.sqlite`
    },
    useNullAsDefault: true
  });
  await createBalancesDbTables(balancesDb);

  const networkContract = new NetworkContractService(denContract, denSdk, testnet);
  const nodeData = {
    nodeId,
    version: nodeVersion,
    owner: jwkAddress,
    url,
    port,
    address,
    networkId,
    testnet,
    networkContractId,
    wallet
  };
  const node = new ExecutionNode(nodeData, contractsSdk, networkContract, arweave, balancesDb);
  const snowball = new Snowball();

  const app = new Koa<Application.DefaultState, NodeContext>();

  app.context.arweave = arweave;
  app.context.contractsSdk = contractsSdk;
  app.context.logger = logger;
  app.context.node = node;
  app.context.networkContract = networkContract;
  app.context.snowball = snowball;
  app.context.arweaveWrapper = new ArweaveWrapper(arweave);
  app.context.balancesDb = balancesDb;

  app.use(cors({
    async origin() {
      return '*';
    },
  }));
  app.use(bodyParser());
  app.use(nodeRouter.routes());
  app.listen(port);

  await runNetworkInfoCacheTask(app.context);
  await runOtherPeersTask(app.context);
  await runContractsTask(app.context);
  await runConsensusParamsTask(app.context);

  try {
    await node.registerInNetwork();
  } catch (e) {
    logger.error(e);
    // TODO: should probably exit here...
  }
})();

function readWallet(): JWKInterface {
  const json = fs.readFileSync(path.join(__dirname, '.secrets', 'wallet.json'), "utf-8");
  return JSON.parse(json);
}
