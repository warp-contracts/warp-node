import Arweave from "arweave";
import {Contract, SmartWeave, SmartWeaveNodeFactory} from "redstone-smartweave";
import {knex} from "knex";
import {JWKInterface} from "arweave/node/lib/wallet";

export async function connectSdk(
  arweave: Arweave,
  cacheDir: string,
  testnet: boolean,
  networkContractId: string,
  jwk: JWKInterface
): Promise<{ sdk: SmartWeave, contract: Contract<any> }> {
  const knexConfig = knex({
    client: 'sqlite3',
    connection: {
      filename: `${cacheDir}/contracts.sqlite`
    },
    useNullAsDefault: true
  });

  let sdk: SmartWeave;
  if (testnet) {
    sdk = await SmartWeaveNodeFactory.knexCached(arweave, knexConfig, 5);
  } else {
    sdk = (await SmartWeaveNodeFactory.knexCachedBased(arweave, knexConfig))
      .useRedStoneGateway({confirmed: true})
      .build();
  }

  const contract = sdk.contract<any>(networkContractId).connect(jwk);
  return {sdk, contract};
}