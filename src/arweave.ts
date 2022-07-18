import Arweave from "arweave";

export const initArweave = (testnet: boolean): Arweave => {
  if (testnet) {
    return Arweave.init({
      host: "arweave.testnet1.bundlr.network",
      port: 443,
      protocol: "https"
    });
  } else {
    return Arweave.init({
      host: "arweave.net",
      port: 443,
      protocol: "https",
      timeout: 60000,
      logging: false,
    });
  }

};
