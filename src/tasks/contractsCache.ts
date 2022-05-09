import {NodeContext} from "../init";
import {TaskRunner} from "../components/TaskRunner";
import {ConsensusParams} from "../components/Snowball";

export const CONTRACTS_INTERVAL = 90 * 1000;

export let cachedContracts: any[] | null = null;

export async function runContractsTask(context: NodeContext) {
  const {logger} = context;

  async function updateContracts() {
    try {
      cachedContracts = await context.networkContract.getContracts(context.node.nodeData);
    } catch (e) {
      logger.error("Error while loading consensus params", e);
    }
  }

  await TaskRunner
    .from("[Contracts]", async () => {
      logger.debug("Loading contracts info");
      if (CONTRACTS_INTERVAL == null) {
        while (CONTRACTS_INTERVAL == null) {
          await updateContracts();
        }
      } else {
        await updateContracts();
      }

    }, context)
    .runSyncEvery(CONTRACTS_INTERVAL, true);
}
