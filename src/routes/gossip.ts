import Router from "@koa/router";
import {NodeData} from "../components/ExecutionNode";
import {Contract} from "redstone-smartweave";

export type GossipQueryResult = {
  node: NodeData;
  hash: string;
};

export const gossipRoute = async (ctx: Router.RouterContext) => {
  const height = parseInt(ctx.query.height as string);
  const type = ctx.query.type as string;
  const contractId = ctx.query.contractId as string;
  const upToTransactionId = ctx.query.upToTransactionId as string;

  if (type === "query") {
    try {
      ctx.logger.info("Querying state for", {
        contractId,
        height,
      });
      const contract: Contract<any> = ctx.sdk.contract(contractId).setEvaluationOptions({
        useFastCopy: true,
        useVM2: true,
        manualCacheFlush: true
      });
      const {state} = await contract.readStateSequencer(height, upToTransactionId);
      const hash = contract.stateHash(state);
      ctx.body = {hash: hash, node: ctx.node.nodeData};
      ctx.status = 200;
    } catch (error: unknown) {
      ctx.body = {peer: ctx.whoami, error};
      ctx.status = 500;
    }
  }
};
