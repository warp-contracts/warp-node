import Router from "@koa/router";

export const infoRoute = async (ctx: Router.RouterContext) => {
  ctx.body = {
    ...ctx.node.nodeData,
    wallet: {}
  };
};
