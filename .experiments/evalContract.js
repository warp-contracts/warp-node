const fs = require("fs");
const path = require("path");
const Arweave = require("arweave");
const { SmartWeaveNodeFactory, LoggerFactory } = require("redstone-smartweave");

(async () => {
    // Set up ArLocal
    // Set up Arweave client
    const arweave = Arweave.init({
        host: "testnet.redstone.tools",
        port: 443,
        protocol: "https"
    });

    const smartweave = SmartWeaveNodeFactory.memCached(arweave);

    const networkInfo = await arweave.network.getInfo();


    const {result, validity} = await smartweave.contract("rpx3X2kIfWPkbf9CvNVRFJR3OuJDtjXuWaQOQAeJujU").readState(networkInfo.height);
})();