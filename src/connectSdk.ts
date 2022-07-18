import Arweave from "arweave";
import {Contract, Warp, WarpNodeFactory} from "warp-contracts";
import {Knex, knex} from "knex";
import {JWKInterface} from "arweave/node/lib/wallet";

export async function connectSdk(
  arweave: Arweave,
  cacheDir: string,
  testnet: boolean,
  networkContractId: string,
  jwk: JWKInterface,
  port: number
): Promise<{ sdk: Warp, contract: Contract<any>, db: Knex}> {
  const db = knex({
    client: 'sqlite3',
    connection: {
      filename: `${cacheDir}/contracts-${port}.sqlite`
    },
    useNullAsDefault: true
  });

  let sdk: Warp;
  if (testnet) {
    sdk = await WarpNodeFactory.knexCached(arweave, db);
  } else {
    sdk = (await WarpNodeFactory.knexCachedBased(arweave, db))
      .useWarpGateway({confirmed: true})
      .build();
  }

  const contract = sdk.contract<any>(networkContractId).connect(jwk);
  return {sdk, contract, db};
}