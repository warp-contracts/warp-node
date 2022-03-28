import Router from "@koa/router";
import {snowball} from "../snowball";

export const currentState = async (ctx: Router.RouterContext) => {
  const id = ctx.query.id as string;

  ctx.logger.info("Current state call", id);

  if (id?.length != 43) {
    ctx.body = {error: "wrong tx format"};
    ctx.status = 500;
    return;
  }

  // evaluate contract
  const {state, validity} = await ctx.sdk.contract(id).readState();

  // load evaluated hash from db
  // TODO: return directly from SDK?
  const hashProposal = (
    await ctx.db
      .select("height", "state", "hash")
      .from("states")
      .where("contract_id", id)
      .orderBy("height", "desc")
      .limit(1)
  )[0];

  ctx.logger.debug("Received", {
    id,
    result: hashProposal
  });

  const result = await snowball(ctx, id, hashProposal.height, hashProposal.hash);
  let response;
  if (result.preference == hashProposal.hash) {
    response = {
      ...result,
      state,
      validity
    }
  } else {
    response = result;
  }

  ctx.body = response;
  ctx.status = 200;
};
