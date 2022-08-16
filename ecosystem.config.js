module.exports = {
    apps: [
        {
            name: "en-1",
            script: "./dist/init.js",
            args: "--port=8080 --testnet='false' --url='http://localhost' --networkId='atomic_nfts_local' --networkContractId='6I3wpwfVTFUfQHzRw3p98PYCoKRpQ-7bV5hwBp63vfs'",
            kill_timeout : 3000
        },
        /*{
            name: "en-2",
            script: "./dist/init.js",
            args: "--port=3001 --testnet='false' --url='http://localhost' --networkId='all_pst' --networkContractId='6EGqLVX6OAsqkra6-aJj0uKnrBVvWzmzmVFypPoTWi0'",
            kill_timeout : 3000
        },*/
      /*  {
            name: "en-2",
            script: "./dist/init.js",
            args: "--port=3002 --testnet='false' --url='http://localhost' --networkId='ppe_testnet_1' --networkContractId='FxjoXsxQyuknaqaCV2Si7sq0TF3taBb8uTRmXmC6FQs'",
            kill_timeout : 3000
        },
        {
            name: "en-3",
            script: "./dist/init.js",
            args: "--port=3003 --testnet='false' --url='http://localhost' --networkId='ppe_testnet_1' --networkContractId='FxjoXsxQyuknaqaCV2Si7sq0TF3taBb8uTRmXmC6FQs'",
            kill_timeout : 3000
        },
        {
            name: "en-4",
            script: "./dist/init.js",
            args: "--port=3004 --testnet='false' --url='http://localhost' --networkId='ppe_testnet_1' --networkContractId='FxjoXsxQyuknaqaCV2Si7sq0TF3taBb8uTRmXmC6FQs'",
            kill_timeout : 3000
        },
        {
            name: "en-5",
            script: "./dist/init.js",
            args: "--port=3005 --testnet='false' --url='http://localhost' --networkId='ppe_testnet_1' --networkContractId='FxjoXsxQyuknaqaCV2Si7sq0TF3taBb8uTRmXmC6FQs'",
            kill_timeout : 3000
        },
        {
            name: "en-6",
            script: "./dist/init.js",
            args: "--port=3006 --testnet='false' --url='http://localhost' --networkId='ppe_testnet_1' --networkContractId='FxjoXsxQyuknaqaCV2Si7sq0TF3taBb8uTRmXmC6FQs'",
            kill_timeout : 3000
        },
        {
            name: "en-7",
            script: "./dist/init.js",
            args: "--port=3007 --testnet='false' --url='http://localhost' --networkId='ppe_testnet_1' --networkContractId='FxjoXsxQyuknaqaCV2Si7sq0TF3taBb8uTRmXmC6FQs'",
            kill_timeout : 3000
        },
        {
            name: "en-8",
            script: "./dist/init.js",
            args: "--port=3008 --testnet='false' --url='http://localhost' --networkId='ppe_testnet_1' --networkContractId='FxjoXsxQyuknaqaCV2Si7sq0TF3taBb8uTRmXmC6FQs'",
            kill_timeout : 3000
        }*/
    ]
}
