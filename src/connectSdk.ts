import Arweave from "arweave";
import {
  defaultCacheOptions,
  defaultWarpGwOptions,
  MemCache,
  Warp,
  WARP_GW_URL,
  WarpFactory,
  WarpGatewayContractDefinitionLoader
} from "warp-contracts";

export async function connectSdk(
  arweave: Arweave,
  cacheDir: string,
  testnet: boolean
): Promise<Warp> {
  let sdk: Warp;
  if (testnet) {
    sdk = WarpFactory.forTestnet();
  } else {
    sdk = WarpFactory.custom(arweave, {...defaultCacheOptions, dbLocation: cacheDir}, 'custom')
      .useWarpGateway(defaultWarpGwOptions.confirmationStatus, defaultWarpGwOptions.source)
      .setDefinitionLoader(new WarpGatewayContractDefinitionLoader(WARP_GW_URL, arweave, new MemCache()))
      .build();
  }

  return sdk
}