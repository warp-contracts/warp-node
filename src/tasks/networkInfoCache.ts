import {NetworkInfoInterface} from "arweave/node/network";
import {NodeContext} from "../init";
import {TaskRunner} from "../components/TaskRunner";

export const BLOCKS_INTERVAL_MS = 30 * 1000;

export let cachedNetworkInfo: NetworkInfoInterface | null = null;

export async function runNetworkInfoCacheTask(context: NodeContext) {
  const {logger, arweaveWrapper} = context;

  async function updateNetworkInfo() {
    try {
      cachedNetworkInfo = await arweaveWrapper.rGwInfo();
      logger.debug("New network height", cachedNetworkInfo.height);
    } catch (e) {
      logger.error("Error while loading network info", e);
    }
  }

  await TaskRunner
    .from("[Arweave network info]", async () => {
      logger.debug("Loading network info");
      if (cachedNetworkInfo == null) {
        while (cachedNetworkInfo == null) {
          await updateNetworkInfo();
        }
      } else {
        await updateNetworkInfo();
      }

    }, context)
    .runSyncEvery(BLOCKS_INTERVAL_MS, true);
}
