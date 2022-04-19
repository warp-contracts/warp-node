import {NodeContext} from "../init";
import {TaskRunner} from "../components/TaskRunner";
import {NodeData} from "../components/ExecutionNode";

export const OTHER_PEERS_INTERVAL = 60 * 1000;

export let cachedOtherPeers: NodeData[] | null = null;

export async function runOtherPeersTask(context: NodeContext) {
  const {logger} = context;

  async function updateOtherPeers() {
    try {
      cachedOtherPeers = await context.networkContract.getOtherNodes(context.node.nodeData);
      logger.debug("Cached other peers", cachedOtherPeers);
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
