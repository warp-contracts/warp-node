import Router from "@koa/router";
import {GossipQueryResult} from "../routes/gossip";
import {LoggerFactory} from "redstone-smartweave";
import {NodeData} from "./ExecutionNode";

export type ConsensusParams = {
  quorumSize: number;
  sampleSize: number;
  decisionThreshold: number;
}

const MAX_PREFERENCE_CHANGES = 10;

// https://docs.avax.network/learn/platform-overview/avalanche-consensus/#algorithm
// https://ipfs.io/ipfs/QmUy4jh5mGNZvLkjies1RWM4YuvJh5o2FYopNPVYwrRVGV page 4., Figure 3.
export class Snowball {
  private readonly logger = LoggerFactory.INST.create("Snowball");

  constructor(private readonly consensusParams: ConsensusParams) {
  }

  async roll(
    ctx: Router.RouterContext,
    contractId: string,
    height: number,
    hash: string): Promise<{ preference: string, rounds: GossipQueryResult[][] }> {

    this.logger.info(`Starting snowball consensus on`, {
      contract: contractId,
      height,
      hash,
      params: this.consensusParams,
    });

    const internalCounts: { [item: string]: number } = {};
    const activePeers: NodeData[] = await ctx.networkContract.getOtherNodes(ctx.node.nodeData);

    this.logger.debug("Other active peers", activePeers.map(a => `${a.nodeId}: ${a.address}`));

    let decided = false;
    let preference = hash;
    let lastPreference = preference;
    let consecutiveSuccesses = 0;
    const votes: GossipQueryResult[] = [];
    const rounds: GossipQueryResult[][] = [];

    let preferenceChanges = 0;

    while (!decided) {
      // TODO: round-robin? weighted round-robin based on nodes reputation?
      const randomPeers = activePeers
        .sort(() => 0.5 - Math.random())
        .slice(0, this.consensusParams.sampleSize);

      const round: GossipQueryResult[] = [];
      rounds.push(round);

      this.logger.info(
        "Querying nodes",
        randomPeers.map((p) => p.address).join(',\n')
      );

      const peersQuery: Promise<Response>[] =
        randomPeers.map((peer) => fetch(`${peer.address}/gossip?type=query&contractId=${contractId}&height=${height}`));

      const peersQueryResult = await Promise.allSettled(peersQuery);
      for (const result of peersQueryResult) {
        if (result.status == "fulfilled") {
          const res = (result as PromiseFulfilledResult<Response>).value
          if (res.ok) {
            const data = await res.json() as unknown as GossipQueryResult;
            votes.push(data);
            round.push(data);
          } else {
            this.logger.error(res.statusText);
          }

        } else {
          this.logger.error(result.reason);
        }
      }

      const votesCounts = this.count(votes.map((item) => item.hash));
      for (const [peerHash, amount] of Object.entries(votesCounts)) {
        if (amount >= this.consensusParams.quorumSize * this.consensusParams.sampleSize) {
          internalCounts[peerHash] = (internalCounts[peerHash] || 0) + 1;

          if (internalCounts[peerHash] >= internalCounts[preference]) {
            preference = peerHash;

            if (preference !== lastPreference) {
              this.logger.info("Preference change", {
                from: lastPreference,
                to: peerHash,
              });
              if (++preferenceChanges > MAX_PREFERENCE_CHANGES) {
                throw new Error("Could not get consensus on state");
              }
              preferenceChanges++;
              lastPreference = peerHash;
              consecutiveSuccesses = 0;
            } else {
              consecutiveSuccesses++;
              if (consecutiveSuccesses > this.consensusParams.decisionThreshold) {
                decided = true;
                break;
              }
            }
          }
        }
      }
    }

    this.logger.info(`[snowball] Consensus: ${preference}`);

    return {
      preference,
      rounds
    }
  }

  private count(array: string[]): { [item: string]: number } {
    const counter: { [item: string]: number } = {};
    array.forEach((item) => (counter[item] = (counter[item] || 0) + 1));
    return counter;
  };
}
