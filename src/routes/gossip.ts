import Router from "@koa/router";
import {NodeData, sdkOptions} from "../components/ExecutionNode";
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
  const type = ctx.query.type as string;
  const contractId = ctx.query.contractId as string;
  const upToSortKey = ctx.query.upToSortKey as string;

  if (type === "query") {
    try {
      const contract: Contract<any> = ctx.contractsSdk.contract(contractId).setEvaluationOptions(sdkOptions);
      const {sortKey, cachedValue} = await contract.readState(upToSortKey);
      const stateHash = contract.stateHash(cachedValue.state);

      const jwk = ctx.node.wallet;
      const owner = jwk.n;

      const dataToSign = await getSigData(ctx.arweave, owner, stateHash, upToSortKey, contractId);
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
  owner: string, stateHash: string, upToSortKey: string, contractId: string) {
  return await deepHash([
    arweave.utils.stringToBuffer(owner),
    arweave.utils.stringToBuffer(upToSortKey),
    arweave.utils.stringToBuffer(contractId),
    arweave.utils.stringToBuffer(stateHash)
  ]);
}
