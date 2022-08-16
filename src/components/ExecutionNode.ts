import {JWKInterface} from "arweave/node/lib/wallet";
import {NetworkContractService} from "./NetworkContractService";
import Arweave from "arweave";
import {cachedContractGroups, cachedContracts} from "../tasks/contractsCache";
import {
  EvalStateResult,
  GQLNodeInterface,
  InteractionsSorter,
  LexicographicalInteractionsSorter,
  LoggerFactory,
  sortingFirst,
  Warp,
  WARP_GW_URL
} from "warp-contracts";
import {Knex} from "knex";

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

export const sdkOptions = {
  useFastCopy: true,
  useIVM: true,
  allowUnsafeClient: true
};

export class ExecutionNode {
  private readonly logger = LoggerFactory.INST.create('ExecutionNode');
  private readonly sorter: InteractionsSorter;
  private evaluating = false;

  constructor(
    private readonly _nodeData: NodeData,
    private readonly sdk: Warp,
    private readonly networkService: NetworkContractService,
    private readonly arweave: Arweave,
    private readonly nodeDb: Knex
  ) {
    this.logger.info('🚀🚀🚀 Starting execution node with params:', {..._nodeData, wallet: ''});
    this.evalContracts = this.evalContracts.bind(this);
    this.sorter = new LexicographicalInteractionsSorter(arweave);
  }

  async registerInNetwork(): Promise<void> {
    if (this._nodeData.testnet) {
      await this.arweave.api.get(`/mint/${this._nodeData.owner}/1000000000000000`);
    }
    try {
      await this.evalContracts();
    } catch (e) {
      this.logger.error(e);
    } finally {
      this.logger.info('✅ Initial contracts evaluation done.');
    }

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
    // const url = `http://localhost:5666/gateway/interactions-contract-groups`;

    let page = 0;
    let limit = 0;
    let items = 0;

    const sortKey = await this.sdk.stateEvaluator.lastCachedSortKey();
    let lastEmptyContractBlockHeight = parseInt((await this.loadLastEmptyContractBlockHeight()).value);
    if (!lastEmptyContractBlockHeight) {
      lastEmptyContractBlockHeight = 1;
    }
    this.logger.info(`Loading from sort key: ${sortKey}, empty contract block height ${lastEmptyContractBlockHeight}`);

    // FIXME: this code works, but is kinda shitty and needs some refactoring ;-)
    do {
      const response = await fetch(
        `${url}?${new URLSearchParams({
          group: contractGroup,
          page: (++page).toString(),
          fromBlockHeight: lastEmptyContractBlockHeight.toString(),
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

      if (items) {
        const interactions = response.interactions;
        let contractInteractions = [];
        let currentContract = interactions[0].contractId.trim();
        for (let interaction of interactions) {
          const contract = interaction.contractId.trim();
          if (!interaction.sortKey) {
            // evaluating leftovers
            // TODO: c-p
            if (contractInteractions?.length) {
              const lastSortKey = contractInteractions?.length ? contractInteractions[contractInteractions.length - 1].sortKey : null;
              this.logger.info(`Evaluating ${currentContract}(${contractInteractions.length} inputs, ${lastSortKey})`);
              try {
                const {sortKey, cachedValue} = await this.sdk.contract(currentContract)
                  .setEvaluationOptions(sdkOptions)
                  .readState(undefined, undefined, contractInteractions);
                await this.upsertBalances(cachedValue.state, currentContract, sortKey);
                await this.upsertState(currentContract, sortKey, cachedValue);
              } catch (e) {
                this.logger.error(`Error while evaluating contract ${currentContract}`, e);
              } finally {
                contractInteractions = [];
              }
            }

            // (o) contract without any interactions
            currentContract = contract;
            this.logger.info(`Evaluating empty contract ${currentContract}: ${interaction.contractCreation}`);
            try {

              const initState = interaction.initState;
              const sortKey = `${interaction.contractCreation.toString().padStart(12, '0')},${''.padEnd(13, '0')},${sortingFirst}`;
              const valueToCache = new EvalStateResult(initState, {}, {});

              await this.sdk.stateEvaluator.putInCache(
                currentContract,
                {
                  dry: false,
                  confirmationStatus: 'confirmed',
                  sortKey
                } as GQLNodeInterface,
                valueToCache
              );
              await this.upsertBalances(initState, currentContract, sortKey);
              await this.upsertState(currentContract, sortKey, valueToCache);
            } catch (e) {
              this.logger.error(`Error while evaluating contract ${currentContract}`, e);
            } finally {
              await this.updateLastEvaluatedEmptyContractBlockHeight(interaction.contractCreation);
            }
          } else {
            // (o) contract with interactions
            if (contract.localeCompare(currentContract) == 0) {
              contractInteractions.push(interaction);
            } else {
              const lastSortKey = contractInteractions?.length ? contractInteractions[contractInteractions.length - 1].sortKey : null;
              this.logger.info(`Evaluating ${currentContract}(${contractInteractions.length} inputs, ${lastSortKey})`);

              try {
                const {sortKey, cachedValue} = await this.sdk.contract(currentContract)
                  .setEvaluationOptions(sdkOptions)
                  .readState(undefined, undefined, contractInteractions);
                await this.upsertBalances(cachedValue.state, currentContract, sortKey);
                await this.upsertState(currentContract, sortKey, cachedValue);
              } catch (e) {
                this.logger.error(`Error while evaluating contract ${currentContract}`, e);
              } finally {
                currentContract = contract;
                contractInteractions = [];
                contractInteractions.push(interaction);
              }
            }
          }
        }

        // evaluating leftovers
        // TODO: c-p
        if (contractInteractions?.length) {
          const lastSortKey = contractInteractions?.length ? contractInteractions[contractInteractions.length - 1].sortKey : null;
          this.logger.info(`Evaluating ${currentContract}(${contractInteractions.length} inputs, ${lastSortKey})`);
          try {
            const {sortKey, cachedValue} = await this.sdk.contract(currentContract)
              .setEvaluationOptions(sdkOptions)
              .readState(undefined, undefined, contractInteractions);
            await this.upsertBalances(cachedValue.state, currentContract, sortKey);
            await this.upsertState(currentContract, sortKey, cachedValue);
          } catch (e) {
            this.logger.error(`Error while evaluating contract ${currentContract}`, e);
          } finally {
            currentContract = null;
            contractInteractions = [];
          }
        }
      }

    } while (items == limit);

  }

  private async upsertBalances(state: any, contractTxId: string, sortKey: string) {
    const balances = state.balances;
    const ticker = state.ticker;
    const name = state.name;

    if (!balances || !ticker) {
      this.logger.error(`Contract ${contractTxId} is not compatible with token standard`);
      return;
    }
    const walletAddresses = Object.keys(balances);
    let inserts = [];
    for (const walletAddress of walletAddresses) {
      inserts.push({
        'wallet_address': walletAddress.trim(),
        'contract_tx_id': contractTxId.trim(),
        'token_ticker': ticker.trim(),
        'token_name': name?.trim(),
        'balance': balances[walletAddress].toString(),
        'sort_key': sortKey
      });
      // sqlite explodes when trying to put too big batch insert
      if (inserts.length == 50) {
        await this.nodeDb('balances')
          .insert(inserts)
          .onConflict(['wallet_address', 'contract_tx_id'])
          .merge();
        inserts = [];
      }
    }
    if (inserts.length) {
      await this.nodeDb('balances')
        .insert(inserts)
        .onConflict(['wallet_address', 'contract_tx_id'])
        .merge();
      inserts = [];
    }
  }

  private async evalSingleContracts(): Promise<void> {
    this.logger.info("Evaluating single contracts");
    const contracts = cachedContracts!!;
    const promises = contracts?.map(c => {
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

  private async upsertState(currentContract: any, sortKey: string, cachedValue: EvalStateResult<unknown>) {
    await this.nodeDb('states')
      .insert({
        'contract_tx_id': currentContract.trim(),
        'sort_key': sortKey,
        'state': cachedValue.state,
        'validity': cachedValue.validity,
        'error_messages': cachedValue.errorMessages
      })
      .onConflict(['contract_tx_id'])
      .merge();
  }

  private async loadLastEmptyContractBlockHeight() {
    return this.nodeDb('node_settings')
      .where({'key': 'last_empty_contract_block_height'})
      .select('value')
      .first();
  }

  private async updateLastEvaluatedEmptyContractBlockHeight(contractCreation: number) {
    await this.nodeDb('node_settings')
      .where({'key': 'last_empty_contract_block_height'})
      .update({'value': contractCreation.toString()});
  }
}