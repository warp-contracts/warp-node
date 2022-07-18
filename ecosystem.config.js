module.exports = {
    apps: [
        {
            name: "en-1",
            script: "./dist/init.js",
            args: "--port=8080 --testnet='true' --url='http://13.53.177.199' --networkId='bundlr_network_testnet' --networkContractId='5LxYlcB8YwGNlRLC2uEbK40Usd6t8tmIxtba5jfb3xc'",
            kill_timeout : 3000
        },
        {
            name: "en-2",
            script: "./dist/init.js",
            args: "--port=3002 --testnet='true' --url='http://13.53.177.199' --networkId='bundlr_network_testnet' --networkContractId='5LxYlcB8YwGNlRLC2uEbK40Usd6t8tmIxtba5jfb3xc'",
            kill_timeout : 3000
        }
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
