import Router from "@koa/router";
import {NetworkContractService} from "../components/NetworkContractService";
import {cachedNetworkInfo} from "../tasks/networkInfoCache";
import {Contract} from "redstone-smartweave";

export const currentState = async (ctx: Router.RouterContext) => {
  const contractId = ctx.query.id as string;

  const networkContract: NetworkContractService = ctx.networkContract;
  const contracts: any[] = await networkContract.getContracts(ctx.node.nodeData);
  if (!contracts.some(c => c.arweaveTxId == contractId)) {
    ctx.body = {error: `Contract ${contractId} not registered in network ${ctx.node.nodeData.nodeId}.`};
    ctx.status = 500;
    return;
  }

  // evaluate contract
  const height = cachedNetworkInfo!!.height;

  const contract: Contract<any> = ctx.sdk.contract(contractId).setEvaluationOptions({
    manualCacheFlush: true
  });
  const {state, validity} = await contract.readState(height);
  const keys = Object.keys(validity);
  const length = keys.length;
  const transactionId = keys[length - 1];

  if (!transactionId) {
    throw new Error("Cannot determine transaction id");
  }

  const hash = contract.stateHash(state);

  ctx.logger.debug("Received", {
    id: contractId,
    transactionId: transactionId,
    result: hash
  });

  try {
    const result = await ctx.snowball.roll(ctx, contractId, height, hash, transactionId);
    let response;
    if (result.preference == hash) {
      response = {
        height: height,
        ...result,
        state,
        validity
      }
    } else {
      response = result;
    }

    ctx.body = response;
    ctx.status = 200;
  } catch (e: any) {
    ctx.body = e.message;
    ctx.status = 500;
  }

};
