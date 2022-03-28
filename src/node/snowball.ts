import Router from "@koa/router";
import {GossipQueryResult} from "./routes/gossip";
import {NodeData} from "./ExecutionNode";


const QUORUM_SIZE = 0.6;
const SAMPLE_SIZE = 2;
const DECISION_THRESHOLD = 1;

const count = (array: string[]): { [item: string]: number } => {
  const counter: { [item: string]: number } = {};
  array.forEach((item) => (counter[item] = (counter[item] || 0) + 1));
  return counter;
};

export const snowball = async (
  ctx: Router.RouterContext,
  contractId: string,
  height: number,
  hash: string
): Promise<{preference: string, votes: GossipQueryResult[]}> => {
  // TODO: from network configuration
  ctx.logger.info(`Starting snowball consensus on`, {
    contract: contractId,
    height,
    hash,
    params: {
      quorum: QUORUM_SIZE,
      peers_to_query: SAMPLE_SIZE,
      threshold: DECISION_THRESHOLD,
    },
  });

  const internalCounts: { [item: string]: number } = {};

  const activePeers: NodeData[] = await ctx.networkContract.getOtherNodes(ctx.node.nodeData);

  ctx.logger.debug("Other active peers", activePeers.map(a => `${a.nodeId}: ${a.address}`));

  // https://docs.avax.network/learn/platform-overview/avalanche-consensus/#algorithm
  // https://ipfs.io/ipfs/QmUy4jh5mGNZvLkjies1RWM4YuvJh5o2FYopNPVYwrRVGV page 4., Figure 3.
  let decided = false;
  let preference = hash;
  let lastPreference = preference;
  let consecutiveSuccesses = 0;
  const votes: GossipQueryResult[] = [];

  while (!decided) {
    // TODO: round-robin? weighted round-robin based on nodes reputation?
    const randomPeers = activePeers
      .sort(() => 0.5 - Math.random())
      .slice(0, SAMPLE_SIZE);

    ctx.logger.info(
      "Querying nodes",
      randomPeers.map((p) => p.address).join(', ')
    );

    const peersQuery: Promise<Response>[] =
      randomPeers.map((peer) => fetch(`${peer.address}/gossip?type=query&contractId=${contractId}&height=${height}`));

    const peersQueryResult = await Promise.allSettled(peersQuery);
    for (const result of peersQueryResult) {
      if (result.status == "fulfilled") {
        const res = (result as PromiseFulfilledResult<Response>).value
        if (res.ok) {
          const data = await res.json() as unknown as GossipQueryResult;
          votes.push(data)
          ctx.logger.debug(`Hash returned:`, {
            hash: data.hash,
            nodeId: data.node.nodeId
          });
        } else {
          ctx.logger.error(res.statusText);
        }

      } else {
        ctx.logger.error(result.reason);
      }
    }

    const votesCounts = count(votes.map((item) => item.hash));
    for (const [peerHash, amount] of Object.entries(votesCounts)) {
      if (amount >= QUORUM_SIZE * SAMPLE_SIZE) {
        internalCounts[peerHash] = (internalCounts[peerHash] || 0) + 1;

        if (internalCounts[peerHash] >= internalCounts[preference]) {
          preference = peerHash;

          if (preference !== lastPreference) {
            ctx.logger.info("[snowball] Preference change", {
              from: lastPreference,
              to: peerHash,
            });
            lastPreference = peerHash;
            consecutiveSuccesses = 0;
          } else {
            consecutiveSuccesses++;
            ctx.logger.info(
              "[snowball] consecutive successes",
              consecutiveSuccesses
            );
            if (consecutiveSuccesses > DECISION_THRESHOLD) {
              decided = true;
              break;
            }
          }
        }
      }
    }
  }

  ctx.logger.info(`[snowball] Consensus: ${preference}`);

  return {
    preference,
    votes: votes
  }

  // TODO: now we have consensus - but what next?
  // how to mark the state as accepted on all peers?

  // TODO: send some ARs (tokens?) to nodes that
  // returned accepted state?
  // or - send metrics to smart contract and let
  // the smart contract decide re. bounties?

  // const ip = hashes.find((item) => item.hash === hash)?.ip;
  // TODO: Query for state + validity by hash that won the round
};
