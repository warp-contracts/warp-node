import {JWKInterface} from "arweave/node/lib/wallet";
import {NetworkContractService} from "./NetworkContractService";
import Arweave from "arweave";
import {cachedContractGroups, cachedContracts} from "../tasks/contractsCache";
import {LoggerFactory, Warp, WARP_GW_URL} from "warp-contracts";
import * as os from "os";
import pLimit from "p-limit";

export type NodeData = {
  nodeId: string,
  version: string,
  owner: string,
  url: string,
  port: number,
  address: string,
  networkId: string,
  testnet: boolean,
  networkContractId: string,
  wallet: JWKInterface
  blacklisted?: boolean
}

const sdkOptions = {
  useFastCopy: true,
  useVM2: true,
  allowUnsafeClient: true
};

// assuming 2 threads per core...
const prLimit = pLimit(os.cpus().length);

export class ExecutionNode {
  private readonly logger = LoggerFactory.INST.create('ExecutionNode');
  private evaluating = false;

  /*private readonly pool = Pool(() => spawn(new Worker("./workers/contractWorker")),
    os.cpus().length * 2);*/

  constructor(
    private readonly _nodeData: NodeData,
    private readonly sdk: Warp,
    private readonly networkService: NetworkContractService,
    private readonly arweave: Arweave,
  ) {
    this.logger.info('🚀🚀🚀 Starting execution node with params:', {..._nodeData, wallet: ''});
    this.evalContracts = this.evalContracts.bind(this);
    const timer = setInterval(() => {
      this.logger.info(`Active tasks: ${prLimit.activeCount}, pending: ${prLimit.pendingCount}`);
    }, 5000);
  }

  async registerInNetwork(): Promise<void> {
    if (this._nodeData.testnet) {
      await this.arweave.api.get(`/mint/${this._nodeData.owner}/1000000000000000`);
    }
    await this.evalContracts();
    this.logger.info('✅ Initial contracts evaluation done.');

    try {
      await this.networkService.connectToNetwork(this._nodeData);
      this.logger.info('✅ Successfully registered in network', this._nodeData.networkId);
    } catch (e) {
      this.logger.error(e);
    }

    this.scheduleSyncTask();
  }

  async evalContracts(): Promise<void> {
    this.logger.info(`💻 Evaluating contracts state`);
    const contractGroups = cachedContractGroups!!;

    for (const contractGroup of contractGroups) {
      this.logger.info(`💻 Loading interactions for group ${contractGroup}`);
      await this.evaluateContractGroup(contractGroup);
    }

    await this.evalSingleContracts();
  }

  private async evaluateContractGroup(contractGroup: string): Promise<void> {
    const url = `${WARP_GW_URL}/gateway/interactions-contract-groups`;

    let page = 0;
    let limit = 0;
    let items = 0;

    const sortKey = await this.sdk.stateEvaluator.lastCachedSortKey();
    this.logger.info(`Loading from sort key: ${sortKey}`);

    do {
      const response = await fetch(
        `${url}?${new URLSearchParams({
          group: contractGroup,
          page: (++page).toString(),
          ...(sortKey ? {fromSortKey: sortKey} : ''),
        })}`
      )
        .then((res) => {
          return res.ok ? res.json() : Promise.reject(res);
        })
        .catch((error) => {
          if (error.body?.message) {
            this.logger.error(error.body.message);
          }
          throw new Error(`Unable to retrieve transactions. Warp gateway responded with status ${error.status}.`);
        });

      this.logger.info("New interactions", response.paging);

      limit = response.paging.limit;
      items = response.paging.items;

      const contracts = response.interactions;

      const jobs = Object.keys(contracts).map(contract => {
        prLimit(() => this.sdk.contract(contract)
          .setEvaluationOptions(sdkOptions)
          .readState(undefined, undefined, contracts[contract]));
      });

      await Promise.allSettled(jobs);

    } while (items == limit);

  }

  private async evalSingleContracts(): Promise<void> {
    this.logger.info("Evaluating single contracts");
    const contracts = cachedContracts!!;
    const promises = contracts.map(c => {
      this.sdk.contract(c.arweaveTxId)
        .setEvaluationOptions(sdkOptions)
        .readState();
    });

    try {
      await Promise.allSettled(promises);
    } catch (e: any) {
      this.logger.error(e);
    }
  }

  scheduleSyncTask(): void {
    this.logger.info(`🔄 Starting state sync task.`);
    const evalContracts = this.evalContracts;

    const node = this;

    (function workerLoop() {
      setTimeout(async () => {
        if (node.evaluating) {
          node.logger.info("Still evaluating previous round...");
          return;
        }
        node.evaluating = true;
        try {
          await evalContracts();
        } finally {
          node.evaluating = false;
        }
        workerLoop();
      }, 10000);
    })();
  }


  get nodeData(): NodeData {
    return {
      ...this._nodeData,
      wallet: {} as JWKInterface
    };
  }

  get wallet(): JWKInterface {
    return this._nodeData.wallet;
  }
}