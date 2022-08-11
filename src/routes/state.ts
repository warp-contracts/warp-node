import Router from "@koa/router";
import {NetworkContractService} from "../components/NetworkContractService";
import {cachedNetworkInfo} from "../tasks/networkInfoCache";
import {Contract} from "warp-contracts";
import {sdkOptions} from "../components/ExecutionNode";

export const state = async (ctx: Router.RouterContext) => {
  const contractId = ctx.query.id as string;
  const showValidity = ctx.query.validity === 'true';
  const snowball = ctx.query.snowball !== 'false';

  const networkContract: NetworkContractService = ctx.networkContract;

  const contracts: any[] = (await networkContract.getContractsAndGroups(ctx.node.nodeData)).contracts;
  if (!contracts.some(c => c.arweaveTxId == contractId)
    && !(await ctx.contractsSdk.stateEvaluator.hasContractCached(contractId))) {
    ctx.body = {error: `Contract ${contractId} not registered in network ${ctx.node.nodeData.nodeId}.`};
    ctx.status = 500;
    return;
  }

  const contract: Contract<any> = ctx.contractsSdk.contract(contractId).setEvaluationOptions(sdkOptions);
  const {sortKey, cachedValue} = await contract.readState();
  if (sortKey == null) {
    throw new Error("Contract has no registered interactions");
  }

  const hash = contract.stateHash(cachedValue.state);

  ctx.logger.debug("Received", {
    id: contractId,
    sortKey,
    result: hash
  });

  try {
    let response;

    if (snowball) {
      const result = await ctx.snowball.roll(ctx, contractId, hash, sortKey);
      if (result.preference == hash) {
        response = {
          evaluatedInteractions: Object.keys(cachedValue.validity).length,
          lastSortKey: sortKey,
          ...result,
          state
        }
        if (showValidity) {
          response = {
            ...response,
            validity: cachedValue.validity
          }
        }
      } else {
        response = result;
      }
    } else {
      response = {
        evaluatedInteractions: Object.keys(cachedValue.validity).length,
        lastSortKey: sortKey,
        state
      }
      if (showValidity) {
        response = {
          ...response,
          validity: cachedValue.validity
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
