import Router from "@koa/router";
import {NetworkContractService} from "../components/NetworkContractService";

export const currentState = async (ctx: Router.RouterContext) => {
  const contractId = ctx.query.id as string;

  const networkContract: NetworkContractService = ctx.networkContract;
  const contracts: any[] = await networkContract.getContracts(ctx.node.nodeData);
  if (!contracts.some(c => c.arweaveTxId == contractId)) {
    ctx.body = {error: `Contract ${contractId} not registered in network ${ctx.node.nodeData.nodeId}.`};
    ctx.status = 500;
    return;
  }

  // evaluate contract
  const {state, validity} = await ctx.sdk.contract(contractId).readState();

  // load evaluated hash from db
  // TODO: return directly from SDK to speed up?
  const hashProposal = (
    await ctx.db
      .select("height", "state", "hash")
      .from("states")
      .where("contract_id", contractId)
      .orderBy("height", "desc")
      .limit(1)
  )[0];

  ctx.logger.debug("Received", {
    id: contractId,
    result: hashProposal
  });

  try {
    const result = await ctx.snowball.roll(ctx, contractId, hashProposal.height, hashProposal.hash);
    let response;
    if (result.preference == hashProposal.hash) {
      response = {
        height: hashProposal.height,
        ...result,
        state,
        validity
      }
    } else {
      response = result;
    }

    ctx.body = response;
    ctx.status = 200;
  } catch (e: any) {
    ctx.body = e.message;
    ctx.status = 500;
  }

};
