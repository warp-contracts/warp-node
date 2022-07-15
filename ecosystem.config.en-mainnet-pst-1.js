module.exports = {
    apps: [
        {
            name: "en-1",
            script: "./dist/init.js",
            args: "--port=8080 --testnet='false' --url='http://13.51.146.196' --networkId='warp_pst_network_test' --networkContractId='251BuOmJcQ0RIJCDdydXvhYYIzEbzO_wppgJsBusfA0'"
        }/*,
        {
            name: "en-2",
            script: "./dist/init.js",
            args: "--port=3002 --testnet='false' --url='http://13.51.146.196' --networkId='warp_pst_network_test' --networkContractId='251BuOmJcQ0RIJCDdydXvhYYIzEbzO_wppgJsBusfA0'"
        },*/
        /*{
            name: "en-3",
            script: "./dist/init.js",
            args: "--port=3003 --testnet='false' --url='http://ec2-13-49-66-156.eu-north-1.compute.amazonaws.com' --networkId='redstone_network' --networkContractId='FxjoXsxQyuknaqaCV2Si7sq0TF3taBb8uTRmXmC6FQs'"
        },
        {
            name: "en-4",
            script: "./dist/init.js",
            args: "--port=3004 --testnet='false' --url='http://ec2-13-49-66-156.eu-north-1.compute.amazonaws.com' --networkId='redstone_network' --networkContractId='FxjoXsxQyuknaqaCV2Si7sq0TF3taBb8uTRmXmC6FQs'"
        }*/
    ]
}
