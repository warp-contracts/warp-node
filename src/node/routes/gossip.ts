import Router from "@koa/router";
import {NodeData} from "../ExecutionNode";

export type GossipQueryResult = {
  node: NodeData;
  hash: string;
};

export const gossipRoute = async (ctx: Router.RouterContext) => {
  const height = parseInt(ctx.query.height as string);
  const type = ctx.query.type as string;
  const contractId = ctx.query.contractId as string;

  if (type === "query") {
    try {
      ctx.logger.info("Querying state for", {
        contractId,
        height,
      });
      // evaluate contract
      await ctx.sdk.contract(contractId).readState(height);

      // load evaluated hash from node's db
      const result = (
        await ctx.db
          .select("hash")
          .from("states")
          .where("contract_id", contractId)
          .andWhere("height", height)
          .limit(1)
      )[0];

      ctx.body = { hash: result.hash, node: ctx.node.nodeData };
      ctx.status = 200;
    } catch (error: unknown) {
      ctx.body = { peer: ctx.whoami, error };
      ctx.status = 500;
    }
  }
};
