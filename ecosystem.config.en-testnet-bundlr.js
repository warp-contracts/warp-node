module.exports = {
    apps: [
        {
            name: "en-1",
            script: "./dist/node/init.js",
            args: "--port=3001 --url='http://ec2-13-51-162-66.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='LtEAEAyVdQfTamLdCz6zeX9ji0hMZ6iaXttrTexra9A'"
        },
        {
            name: "en-2",
            script: "./dist/node/init.js",
            args: "--port=3002 --url='http://ec2-13-51-162-66.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='LtEAEAyVdQfTamLdCz6zeX9ji0hMZ6iaXttrTexra9A'"
        },
        {
            name: "en-3",
            script: "./dist/node/init.js",
            args: "--port=3003 --url='http://ec2-13-51-162-66.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='LtEAEAyVdQfTamLdCz6zeX9ji0hMZ6iaXttrTexra9A'"
        },
        {
            name: "en-4",
            script: "./dist/node/init.js",
            args: "--port=3004 --url='http://ec2-13-51-162-66.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='LtEAEAyVdQfTamLdCz6zeX9ji0hMZ6iaXttrTexra9A'"
        }
    ]
}
