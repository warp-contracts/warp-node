module.exports = {
    apps: [
        {
            name: "en-1",
            script: "./dist/init.js",
            args: "--port=8080 --testnet='false' --url='http://13.49.66.156' --networkId='redstone_network' --networkContractId='_dK3pzMY4b4VEG43suCw10mOwTTq8BrDlaszbQd5iHE'"
        },
        {
            name: "en-2",
            script: "./dist/init.js",
            args: "--port=3002 --testnet='false' --url='http://13.49.66.156' --networkId='redstone_network' --networkContractId='_dK3pzMY4b4VEG43suCw10mOwTTq8BrDlaszbQd5iHE'"
        },
        /*{
            name: "en-3",
            script: "./dist/init.js",
            args: "--port=3003 --testnet='false' --url='http://ec2-13-49-66-156.eu-north-1.compute.amazonaws.com' --networkId='redstone_network' --networkContractId='_dK3pzMY4b4VEG43suCw10mOwTTq8BrDlaszbQd5iHE'"
        },
        {
            name: "en-4",
            script: "./dist/init.js",
            args: "--port=3004 --testnet='false' --url='http://ec2-13-49-66-156.eu-north-1.compute.amazonaws.com' --networkId='redstone_network' --networkContractId='_dK3pzMY4b4VEG43suCw10mOwTTq8BrDlaszbQd5iHE'"
        }*/
    ]
}
