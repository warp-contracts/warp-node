import Router from "@koa/router";
import {cachedConsensusParams} from "../tasks/consensusParamsCache";
import {cachedOtherPeers} from "../tasks/otherPeersCache";
import {cachedContracts} from "../tasks/contractsCache";

export const ehloRoute = async (ctx: Router.RouterContext) => {
  ctx.body = {
    ...ctx.node.nodeData,
    consensusParams: cachedConsensusParams,
    otherNodes: cachedOtherPeers,
    contracts: cachedContracts
  };
};
