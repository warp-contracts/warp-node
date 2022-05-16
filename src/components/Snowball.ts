import Router from "@koa/router";
import {getSigData, GossipQueryResult} from "../routes/gossip";
import {LoggerFactory} from "redstone-smartweave";
import {NodeData} from "./ExecutionNode";
import {cachedOtherPeers} from "../tasks/otherPeersCache";
import {cachedConsensusParams} from "../tasks/consensusParamsCache";

export type ConsensusParams = {
  quorumSize: number;
  sampleSize: number;
  decisionThreshold: number;
}

const MAX_PREFERENCE_CHANGES = 5;

// https://docs.avax.network/learn/platform-overview/avalanche-consensus/#algorithm
// https://ipfs.io/ipfs/QmUy4jh5mGNZvLkjies1RWM4YuvJh5o2FYopNPVYwrRVGV page 4., Figure 3.
export class Snowball {
  private readonly logger = LoggerFactory.INST.create("Snowball");

  async roll(
    ctx: Router.RouterContext,
    contractId: string,
    height: number,
    hash: string,
    upToTransactionId: string): Promise<{ preference: string, rounds: GossipQueryResult[][] }> {

    const consensusParams = cachedConsensusParams;
    if (consensusParams == null) {
      throw new Error("Consensus params not available");
    }
    
    this.logger.info(`Starting snowball consensus on`, {
      contract: contractId,
      height,
      hash,
      upToTransactionId,
      params: consensusParams,
    });

    const internalCounts: { [item: string]: number } = {};

    const activePeers: NodeData[] | undefined = cachedOtherPeers?.filter(p => !p.blacklisted);
    if (!activePeers) {
      throw new Error("Cannot determine active peers.");
    }
    if (activePeers.length < consensusParams.sampleSize) {
      throw new Error(`Not enough active peers. Active ${activePeers.length}, sampleSize: ${consensusParams.sampleSize}`);
    }

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
        .slice(0, consensusParams.sampleSize);

      const round: GossipQueryResult[] = [];
      rounds.push(round);

      this.logger.info(
        "Querying nodes",
        randomPeers.map((p) => p.address).join(', ')
      );

      const peersQuery: Promise<Response>[] =
        randomPeers.map((peer) => fetch(`${peer.address}/gossip?type=query&contractId=${contractId}&height=${height}&upToTransactionId=${upToTransactionId}`));

      const peersQueryResult = await Promise.allSettled(peersQuery);
      for (const result of peersQueryResult) {
        if (result.status == "fulfilled") {
          const res = (result as PromiseFulfilledResult<Response>).value
          if (res.ok) {
            const data = await res.json() as unknown as GossipQueryResult;

            const verifyResult = await ctx.arweave.crypto.verify(
              data.signature.owner,
              await getSigData(ctx.arweave, data.signature.owner, data.hash),
              ctx.arweave.utils.b64UrlToBuffer(data.signature.sig)
            );
            if (verifyResult) {
              ctx.logger.info(`Signature verification successful for ${data.node.nodeId}`);
              votes.push(data);
              round.push(data);
            } else {
              ctx.logger.error("Signature verification failed for", JSON.stringify(data));
            }

          } else {
            this.logger.error(res.statusText);
          }

        } else {
          this.logger.error(result.reason);
        }
      }

      if (round.length < consensusParams.sampleSize) {
        this.logger.warn("Not enough successful response from peers, moving to next round");
        continue;
      }

      const votesCounts = this.count(votes.map((item) => item.hash));
      for (const [peerHash, amount] of Object.entries(votesCounts)) {
        if (amount >= consensusParams.quorumSize * consensusParams.sampleSize) {
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
              if (consecutiveSuccesses > consensusParams.decisionThreshold) {
                decided = true;
                break;
              }
            }
          }
        }
      }
    }

    this.logger.info(`Consensus: ${preference}`);

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
