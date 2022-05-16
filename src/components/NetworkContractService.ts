import {Contract, SmartWeave} from "redstone-smartweave";
import {NodeData} from "./ExecutionNode";
import {ConsensusParams} from "./Snowball";

/**
 * A wrapper for SmartWeave "network" contract.
 */
export class NetworkContractService {
  constructor(
    private readonly contract: Contract<any>,
    private readonly sdk: SmartWeave,
    private readonly testnet: boolean) {
  }

  async connectToNetwork(nodeData: NodeData): Promise<void> {
    await this.writeInteraction({
      function: 'connectNode',
      connectNode: {
        nodeId: nodeData.nodeId,
        url: nodeData.url,
        port: nodeData.port,
        address: nodeData.address,
        owner: nodeData.owner,
        networkId: nodeData.networkId
      }
    });
  }

  async disconnectFromNetwork(nodeData: NodeData): Promise<any> {
    return await this.writeInteraction({
      function: 'disconnectNode',
      disconnectNode: {
        id: nodeData.nodeId,
        networkId: nodeData.networkId
      }
    });
  }

  async getContracts(nodeData: NodeData): Promise<any[]> {
    const {state, validity} = await this.readState();
    const contracts = state.networks[nodeData.networkId].contracts;
    return contracts;
  }

  async getOtherNodes(nodeData: NodeData): Promise<any[]> {
    const {state, validity} = await this.readState();
    const networkId = nodeData.networkId;
    const nodes = state.networks[networkId].connectedNodes;
    return Object.keys(nodes).filter((n: string) => n != nodeData.nodeId).map(k => nodes[k]);
  }

  async consensusParams(nodeData: NodeData): Promise<ConsensusParams> {
    const {state, validity} = await this.readState();
    const networkId = nodeData.networkId;
    const consensusParams = state.networks[networkId].consensusParams;

    return {
      quorumSize: parseInt(consensusParams.quorumSize),
      sampleSize: parseInt(consensusParams.sampleSize),
      decisionThreshold: parseFloat(consensusParams.decisionThreshold)
    }
  }

  async readState(): Promise<{ state: any, validity: any }> {
    return await this.contract
      .setEvaluationOptions({
        useFastCopy: true,
        useVM2: true,
        manualCacheFlush: true
      })
      .readState();
  }

  private async writeInteraction(input: any): Promise<any> {
    if (this.testnet) {
      const result = await this.contract.writeInteraction(input, undefined, undefined, true);
      await this.sdk.arweave.api.get('mine');
      return result;
    } else {
      return await this.contract.bundleInteraction(input, {
        strict: true
      });
    }
  }
}