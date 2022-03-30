module.exports = {
    apps: [
        {
            name: "en-1",
            script: "./dist/init.js",
            args: "--port=3001 --testnet='false' --url='http://ec2-13-51-200-106.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='LtEAEAyVdQfTamLdCz6zeX9ji0hMZ6iaXttrTexra9A'"
        },
        {
            name: "en-2",
            script: "./dist/init.js",
            args: "--port=3002 --testnet='false' --url='http://ec2-13-51-200-106.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='LtEAEAyVdQfTamLdCz6zeX9ji0hMZ6iaXttrTexra9A'"
        },
        {
            name: "en-3",
            script: "./dist/init.js",
            args: "--port=3003 --testnet='false' --url='http://ec2-13-51-200-106.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='LtEAEAyVdQfTamLdCz6zeX9ji0hMZ6iaXttrTexra9A'"
        },
        {
            name: "en-4",
            script: "./dist/init.js",
            args: "--port=3004 --testnet='false' --url='http://ec2-13-51-200-106.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='LtEAEAyVdQfTamLdCz6zeX9ji0hMZ6iaXttrTexra9A'"
        }
    ]
}
