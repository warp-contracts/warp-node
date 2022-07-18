import Arweave from "arweave";
import {Warp, WarpNodeFactory} from "warp-contracts";
import {knex} from "knex";

export async function connectSdk(
  arweave: Arweave,
  cacheDir: string,
  testnet: boolean,
  port: number
): Promise<Warp> {
  const db = knex({
    client: 'sqlite3',
    connection: {
      filename: `${cacheDir}/${port}.sqlite`
    },
    useNullAsDefault: true
  });

  let sdk: Warp;
  if (testnet) {
    sdk = (await WarpNodeFactory.knexCachedBased(arweave, db)).useArweaveGateway().build();
  } else {
    sdk = (await WarpNodeFactory.knexCachedBased(arweave, db))
      .useWarpGateway({confirmed: true})
      .build();
  }

  return sdk;
}