import Router from "@koa/router";
import {NodeData} from "../components/ExecutionNode";
import {Contract} from "warp-contracts";
import deepHash from "arweave/node/lib/deepHash";
import Arweave from "arweave";

export type GossipQueryResult = {
  node: NodeData;
  hash: string;
  signature: {
    owner: string,
    sig: string
  }
};

export const gossipRoute = async (ctx: Router.RouterContext) => {
  const height = parseInt(ctx.query.height as string);
  const type = ctx.query.type as string;
  const contractId = ctx.query.contractId as string;
  const upToTransactionId = ctx.query.upToTransactionId as string;

  if (type === "query") {
    try {
      const contract: Contract<any> = ctx.sdk.contract(contractId).setEvaluationOptions({
        useFastCopy: true,
        useVM2: true,
        manualCacheFlush: true
      });
      const {state} = await contract.readState(upToTransactionId);
      const stateHash = contract.stateHash(state);

      const jwk = ctx.node.wallet;
      const owner = jwk.n;

      const dataToSign = await getSigData(ctx.arweave, owner, stateHash, upToTransactionId, contractId);
      const rawSig = await ctx.arweave.crypto.sign(jwk, dataToSign);

      ctx.body = {
        hash: stateHash,
        node: ctx.node.nodeData,
        signature: {
          owner: jwk.n,
          sig: ctx.arweave.utils.bufferTob64Url(rawSig),
        }
      };
      ctx.status = 200;
    } catch (error: unknown) {
      ctx.body = {peer: ctx.whoami, error};
      ctx.status = 500;
    }
  }
};

export async function getSigData(
  arweave: Arweave,
  owner: string, stateHash: string, transactionId: string, contractId: string) {
  return await deepHash([
    arweave.utils.stringToBuffer(owner),
    arweave.utils.stringToBuffer(transactionId),
    arweave.utils.stringToBuffer(contractId),
    arweave.utils.stringToBuffer(stateHash)
  ]);
}
