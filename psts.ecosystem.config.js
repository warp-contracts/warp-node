module.exports = {
  apps: [
    {
      name: "en-1",
      script: "./dist/init.js",
      args: "--port=8080 --testnet='false' --url='http://16.171.44.70' --networkId='all_pst' --networkContractId='f4skRMstoodrRluvl4OCY-Xo50AamgxYwBCZKzw3Uvo'",
      kill_timeout: 3000,
      max_memory_restart: '1500M'
    },
    {
      name: "en-2",
      script: "./dist/init.js",
      args: "--port=3001 --testnet='false' --url='http://16.171.44.70' --networkId='all_pst' --networkContractId='f4skRMstoodrRluvl4OCY-Xo50AamgxYwBCZKzw3Uvo'",
      kill_timeout: 3000,
      max_memory_restart: '1500M'
    }
  ]
}
