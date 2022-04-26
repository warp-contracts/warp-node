import {NodeContext} from "../init";
import {TaskRunner} from "../components/TaskRunner";
import {NodeData} from "../components/ExecutionNode";
import {fetchWithTimeout} from "../utils";

export const OTHER_PEERS_INTERVAL = 60 * 1000;

export let cachedOtherPeers: NodeData[] | null = null;

export async function runOtherPeersTask(context: NodeContext) {
  const {logger} = context;

  async function updateOtherPeers() {
    try {
      cachedOtherPeers = await context.networkContract.getOtherNodes(context.node.nodeData);
      const verificationPromises = cachedOtherPeers.map(p => fetchWithTimeout(
        `${p.address}/ehlo`, {timeout: 3000}
      ));
      const verificationResults = await Promise.allSettled(verificationPromises);
      for (let i = 0; i < verificationResults.length; i++) {
        const verificationResult = verificationResults[i];
        cachedOtherPeers[i].blacklisted = verificationResult.status == 'fulfilled'
          ? verificationResult.value.status !== 200
          : true;
      }
      logger.debug("Cached other peers", cachedOtherPeers.map(
        p => ({address: p.address, blacklisted: p.blacklisted})));
    } catch (e) {
      logger.error("Error while loading other peers info", e);
    }
  }

  await TaskRunner
    .from("[Other peers info]", async () => {
      logger.debug("Loading other peers info");
      if (cachedOtherPeers == null) {
        while (cachedOtherPeers == null) {
          await updateOtherPeers();
        }
      } else {
        await updateOtherPeers();
      }

    }, context)
    .runSyncEvery(OTHER_PEERS_INTERVAL, true);
}
