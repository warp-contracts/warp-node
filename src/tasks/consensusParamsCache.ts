import {NodeContext} from "../init";
import {TaskRunner} from "../components/TaskRunner";
import {ConsensusParams} from "../components/Snowball";

export const CONSENSUS_PARAMS_INTERVAL = 360 * 1000;

export let cachedConsensusParams: ConsensusParams | null = null;

export async function runConsensusParamsTask(context: NodeContext) {
  const {logger} = context;

  async function updateConsensusParams() {
    try {
      cachedConsensusParams = await context.networkContract.consensusParams(context.node.nodeData);
    } catch (e) {
      logger.error("Error while loading consensus params", e);
    }
  }

  await TaskRunner
    .from("[Consensus params]", async () => {
      logger.debug("Loading consensus params info");
      if (cachedConsensusParams == null) {
        while (cachedConsensusParams == null) {
          await updateConsensusParams();
        }
      } else {
        await updateConsensusParams();
      }

    }, context)
    .runSyncEvery(CONSENSUS_PARAMS_INTERVAL, true);
}
