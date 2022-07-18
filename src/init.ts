import * as path from "path";
import {Knex} from "knex";
import Koa from "koa";
import Application from "koa";
import bodyParser from "koa-bodyparser";
import nodeRouter from "./nodeRouter";
import {ArweaveWrapper, LoggerFactory, WarpLogger, Warp} from "warp-contracts";
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

require("dotenv").config();

const pjson = require('./../package.json');
const cors = require('@koa/cors');

export interface NodeContext {
  db: Knex;
  gatewayDb: Knex;
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
}

const argv = yargs(hideBin(process.argv)).parseSync();

(async () => {
  process
      .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise');
      })
      .on('uncaughtException', err => {
        console.error(err, 'Uncaught Exception thrown');
      });

  const url = argv.url as string;
  const port = (argv.port || 5777) as number;
  const address = `${argv.url}:${port}`;
  const testnet = (argv.testnet || "true") == "true";
  const networkId = argv.networkId as string;
  const networkContractId = argv.networkContractId as string;

  const denDbPath = path.join(__dirname, '.db', 'den');
  const contractsDbPath = path.join(__dirname, '.db', 'contracts');
  const arweave = initArweave(testnet);
  const wallet = readWallet();
  const jwkAddress = await arweave.wallets.getAddress(wallet);
  const nodeId = `${os.hostname()}_${port}_${jwkAddress}`;
  const nodeVersion = pjson.version;

  LoggerFactory.INST.setOptions({
    displayInstanceName: true,
    instanceName: port,
  });
  LoggerFactory.INST.logLevel("error");
  LoggerFactory.INST.logLevel("fatal", "WASM:AS");
  LoggerFactory.INST.logLevel("debug", "node");
  LoggerFactory.INST.logLevel("debug", "ExecutionNode");
  LoggerFactory.INST.logLevel("debug", "NetworkContractService");
  LoggerFactory.INST.logLevel("debug", "Snowball");
  // LoggerFactory.INST.logLevel("debug", "HandlerBasedContract");
  // LoggerFactory.INST.logLevel("debug", "ArweaveGatewayInteractionsLoader");
  const logger = LoggerFactory.INST.create("node");

  if (!fs.existsSync(denDbPath)) {
    fs.mkdirSync(denDbPath, {recursive: true});
  }
  if (!fs.existsSync(contractsDbPath)) {
    fs.mkdirSync(contractsDbPath, {recursive: true});
  }
  const denSdk = await connectSdk(
    Arweave.init({
      host: "arweave.net",
      port: 443,
      protocol: "https",
      timeout: 60000,
      logging: false,
    }),
    denDbPath,
    false,
    port);

  const contractsSdk = await connectSdk(
    arweave,
    contractsDbPath,
    testnet,
    port);

  const denContract = denSdk.contract<any>(networkContractId).connect(wallet);

  const networkContract = new NetworkContractService(denContract, denSdk, false);
  const nodeData = {
    nodeId,
    version: nodeVersion,
    owner: jwkAddress,
    url,
    port,
    address,
    networkId,
    testnet: false,
    networkContractId,
    wallet
  };
  const node = new ExecutionNode(nodeData, contractsSdk, networkContract, arweave);
  const snowball = new Snowball();

  const app = new Koa<Application.DefaultState, NodeContext>();

  app.context.arweave = arweave;
  app.context.contractsSdk = contractsSdk;
  app.context.logger = logger;
  app.context.node = node;
  app.context.networkContract = networkContract;
  app.context.snowball = snowball;
  app.context.arweaveWrapper = new ArweaveWrapper(arweave);

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
    logger.error('Error while registering in network', e);
    /*await node.disconnectFromNetwork();
    await node.registerInNetwork();*/
  }
})();

function readWallet(): JWKInterface {
  const json = fs.readFileSync(path.join(__dirname, '.secrets', 'wallet.json'), "utf-8");
  return JSON.parse(json);
}
