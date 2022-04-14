module.exports = {
    apps: [
        {
            name: "en-1",
            script: "./dist/node/init.js",
            args: "--port=3001 --testnet='false' --url='http://ec2-13-51-163-13.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='Yqyi0euN1jqrwUg8VurvQSpL8AWsPDTlei71-Lg77I4'"
        },
        {
            name: "en-2",
            script: "./dist/node/init.js",
            args: "--port=3002 --testnet='false' --url='http://ec2-13-51-163-13.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='Yqyi0euN1jqrwUg8VurvQSpL8AWsPDTlei71-Lg77I4'"
        },
        {
            name: "en-3",
            script: "./dist/node/init.js",
            args: "--port=3003 --testnet='false' --url='http://ec2-13-51-163-13.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='Yqyi0euN1jqrwUg8VurvQSpL8AWsPDTlei71-Lg77I4'"
        },
        {
            name: "en-4",
            script: "./dist/node/init.js",
            args: "--port=3004 --testnet='false' --url='http://ec2-13-51-163-13.eu-north-1.compute.amazonaws.com' --networkId='redstone_testnet_1' --networkContractId='Yqyi0euN1jqrwUg8VurvQSpL8AWsPDTlei71-Lg77I4'"
        }
    ]
}
