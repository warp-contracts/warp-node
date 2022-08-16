import Router from "@koa/router";
import {NetworkContractService} from "../components/NetworkContractService";
import {Contract} from "warp-contracts";
import {sdkOptions} from "../components/ExecutionNode";
import {getSigData} from "./gossip";

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

  const jwk = ctx.node.wallet;
  const owner = jwk.n;

  const dataToSign = await getSigData(ctx.arweave, owner, hash, sortKey, contractId);
  const rawSig = await ctx.arweave.crypto.sign(jwk, dataToSign);

  const signature = {
    owner: jwk.n,
    sig: ctx.arweave.utils.bufferTob64Url(rawSig),
  }

  try {
    let response;

    if (snowball) {
      const result = await ctx.snowball.roll(ctx, contractId, hash, sortKey);
      if (result.preference == hash) {
        response = {
          evaluatedInteractions: Object.keys(cachedValue.validity).length,
          lastSortKey: sortKey,
          ...result,
          state: cachedValue.state,
          signature
        }
        if (showValidity) {
          response = {
            ...response,
            validity: cachedValue.validity
          }
        }
      } else {
        response = {
          ...result,
          signature
        };
      }
    } else {
      response = {
        evaluatedInteractions: Object.keys(cachedValue.validity).length,
        lastSortKey: sortKey,
        state: cachedValue.state,
        signature
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
