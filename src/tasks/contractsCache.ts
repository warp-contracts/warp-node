import {NodeContext} from "../init";
import {TaskRunner} from "../components/TaskRunner";

export const CONTRACTS_INTERVAL = 90 * 1000;

export let cachedContracts: any[] | null = null;
export let cachedContractGroups: string[] | null = null;
export let cachedEvaluatedContracts: string[] | null = null;
export let cachedLastSortKey: string | null = null;

export async function runContractsTask(context: NodeContext) {
  const {logger, contractsSdk} = context;

  async function updateContracts() {
    try {
      const result = await context.networkContract.getContractsAndGroups(context.node.nodeData);
      cachedContracts = result.contracts;
      cachedContractGroups = result.contractGroups;
      cachedEvaluatedContracts = await contractsSdk.stateEvaluator.allCachedContracts();
      cachedLastSortKey = await contractsSdk.stateEvaluator.lastCachedSortKey();
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
