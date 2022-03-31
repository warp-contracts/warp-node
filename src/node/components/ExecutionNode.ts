import {JWKInterface} from "arweave/node/lib/wallet";
import {LoggerFactory, SmartWeave} from "redstone-smartweave";
import {NetworkContractService} from "./NetworkContractService";
import Arweave from "arweave";
import {cachedNetworkInfo} from "../tasks/networkInfoCache";

export type NodeData = {
  nodeId: string,
  owner: string,
  url: string,
  port: number,
  address: string,
  networkId: string,
  testnet: boolean,
  networkContractId: string,
  wallet: JWKInterface
}

export class ExecutionNode {
  private readonly logger = LoggerFactory.INST.create('ExecutionNode');
  /*private readonly pool = Pool(() => spawn(new Worker("./workers/contractWorker")),
    os.cpus().length * 2); // TODO*/
  lastCalculatedHeight = 0;

  constructor(
    private readonly _nodeData: NodeData,
    private readonly sdk: SmartWeave,
    private readonly networkService: NetworkContractService,
    private readonly arweave: Arweave,
  ) {
    this.logger.info('🚀🚀🚀 Starting execution node with params:', {..._nodeData, wallet:''});
    this.evalContracts = this.evalContracts.bind(this);
  }

  async registerInNetwork(): Promise<void> {
    if (this._nodeData.testnet) {
      await this.arweave.api.get(`/mint/${this._nodeData.owner}/1000000000000000`);
    }
    await this.evalContracts();
    this.logger.info("✅ Initial contracts evaluation done.");

    await this.networkService.connectToNetwork(this._nodeData);
    this.logger.info('✅ Successfully registered in network', this._nodeData.networkId);

    this.scheduleSyncTask();
  }

  async disconnectFromNetwork(): Promise<void> {
    this.logger.debug('Disconnecting from network');
    await this.networkService.disconnectFromNetwork(this._nodeData);
    this.logger.info('🔌 Successfully disconnected from network', this._nodeData.networkId);
  }

  async evalContracts(): Promise<void> {
    this.logger.info(`💻 Evaluating contracts state`);

    const contracts = await this.networkService.getContracts(this._nodeData); //TODO: cache
    const calculationHeight = cachedNetworkInfo!!.height!!;

    if (this.lastCalculatedHeight == calculationHeight) {
      this.logger.info(`Cache for ${calculationHeight} already calculated.`);
    }

    const promises = contracts.map(c => {
      this.sdk.contract(c.arweaveTxId).setEvaluationOptions({
        useFastCopy: true,
        useVM2: true,
        manualCacheFlush: true
      }).readState(calculationHeight);
    });

    await Promise.allSettled(promises);

    this.logger.info(`📓 Storing contracts state`);
    await this.sdk.flushCache();

    this.lastCalculatedHeight = calculationHeight!!;
  }

  scheduleSyncTask(): void {
    this.logger.info(`🔄 Starting state sync task.`);
    const evalContracts = this.evalContracts;

    (function workerLoop() {
      setTimeout(async () => {
        await evalContracts();
        workerLoop();
      }, 30000);
    })();
  }


  get nodeData(): NodeData {
    return {
      ...this._nodeData,
      wallet: {} as JWKInterface
    };
  }
}