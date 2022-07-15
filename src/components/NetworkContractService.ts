import {NodeData} from "./ExecutionNode";
import {ConsensusParams} from "./Snowball";
import {Contract, Warp} from "warp-contracts";

/**
 * A wrapper for Warp "network" contract.
 */
export class NetworkContractService {
  constructor(
    private readonly contract: Contract<any>,
    private readonly sdk: Warp,
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

  async getContractsAndGroups(nodeData: NodeData): Promise<{contracts: any[], contractGroups: string[]}> {
    const {state} = await this.readState();
    return  {
      contracts: state.networks[nodeData.networkId].contracts,
      contractGroups: state.networks[nodeData.networkId].contractGroups
    };
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
      quorumSize: parseFloat(consensusParams.quorumSize),
      sampleSize: parseInt(consensusParams.sampleSize),
      decisionThreshold: parseInt(consensusParams.decisionThreshold)
    }
  }

  async readState(): Promise<{ state: any, validity: any }> {
    return await this.contract
      .setEvaluationOptions({
        useFastCopy: true,
      })
      .readState();
  }

  private async writeInteraction(input: any): Promise<any> {
    if (this.testnet) {
      const result = await this.contract.writeInteraction(input, {
        disableBundling: true,
        strict: true
      });
      await this.sdk.arweave.api.get('mine');
      return result;
    } else {
      return await this.contract.writeInteraction(input, {
        strict: true
      });
    }
  }
}