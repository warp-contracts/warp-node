import Router from "@koa/router";
import {cachedConsensusParams} from "../tasks/consensusParamsCache";

export const ehloRoute = async (ctx: Router.RouterContext) => {
  ctx.body = {
    ...ctx.node.nodeData,
    consensusParams: cachedConsensusParams,
    otherNodes: await ctx.networkContract.getOtherNodes(ctx.node.nodeData),
    contracts: await ctx.networkContract.getContracts(ctx.node.nodeData)
  };
};
