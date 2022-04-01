import Router from "@koa/router";

export const ehloRoute = async (ctx: Router.RouterContext) => {

  ctx.body = {
    ...ctx.node.nodeData,
    otherNodes: await ctx.networkContract.getOtherNodes(ctx.node.nodeData),
    contracts: await ctx.networkContract.getContracts(ctx.node.nodeData)
  };
};
