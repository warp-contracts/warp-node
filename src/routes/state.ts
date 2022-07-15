import Router from "@koa/router";
import {NetworkContractService} from "../components/NetworkContractService";
import {cachedNetworkInfo} from "../tasks/networkInfoCache";
import {Contract} from "warp-contracts";

export const state = async (ctx: Router.RouterContext) => {
  const contractId = ctx.query.id as string;
  const showValidity = ctx.query.validity === 'true';
  const snowball = ctx.query.snowball !== 'false';
  const safeHeight = ctx.query.safeHeight === 'true';

  const networkContract: NetworkContractService = ctx.networkContract;

  // TODO: groups
  const contracts: any[] = (await networkContract.getContractsAndGroups(ctx.node.nodeData)).contracts;
  if (!contracts.some(c => c.arweaveTxId == contractId)
    && !(await ctx.contractsSdk.stateEvaluator.hasContractCached(contractId))) {
    ctx.body = {error: `Contract ${contractId} not registered in network ${ctx.node.nodeData.nodeId}.`};
    ctx.status = 500;
    return;
  }

  // evaluate contract
  if (!cachedNetworkInfo || !cachedNetworkInfo.height) {
    throw new Error("Network info not available");
  }
  let height = cachedNetworkInfo.height;
  if (safeHeight) {
    height--;
  }

  ctx.logger.info("Requested height", height);

  const contract: Contract<any> = ctx.contractsSdk.contract(contractId).setEvaluationOptions({
    useFastCopy: true,
    useVM2: true,
    manualCacheFlush: true
  });
  const {state, validity} = await contract.readState(height);
  const keys = Object.keys(validity);
  const length = keys.length;
  if (length == 0) {
    throw new Error("Contract has no registered interactions");
  }
  const transactionId = keys[length - 1];

  const hash = contract.stateHash(state);

  ctx.logger.debug("Received", {
    id: contractId,
    transactionId: transactionId,
    result: hash
  });

  try {
    let response;

    if (snowball) {
      const result = await ctx.snowball.roll(ctx, contractId, height, hash, transactionId);
      if (result.preference == hash) {
        response = {
          evaluatedInteractions: Object.keys(validity).length,
          lastTransactionId: transactionId,
          height: height,
          ...result,
          state
        }
        if (showValidity) {
          response = {
            ...response,
            validity
          }
        }
      } else {
        response = result;
      }
    } else {
      response = {
        evaluatedInteractions: Object.keys(validity).length,
        lastTransactionId: transactionId,
        height: height,
        state
      }
      if (showValidity) {
        response = {
          ...response,
          validity
        }
      }
    }

    ctx.body = response;
    ctx.status = 200;
  } catch (e: any) {
    ctx.body = e.message;
    ctx.status = 500;
  }

};
