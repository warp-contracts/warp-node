module.exports = {
  apps: [
    {
      name: "en-1",
      script: "./dist/init.js",
      args: "--port=8080 --testnet='false' --url='http://16.171.28.81' --networkId='atomic_nfts' --networkContractId='6I3wpwfVTFUfQHzRw3p98PYCoKRpQ-7bV5hwBp63vfs'",
      kill_timeout: 3000,
      max_memory_restart: '1500M'
    },
    {
      name: "en-2",
      script: "./dist/init.js",
      args: "--port=3001 --testnet='false' --url='http://16.171.28.81' --networkId='atomic_nfts' --networkContractId='6I3wpwfVTFUfQHzRw3p98PYCoKRpQ-7bV5hwBp63vfs'",
      kill_timeout: 3000,
      max_memory_restart: '1500M'
    }
  ]
}
