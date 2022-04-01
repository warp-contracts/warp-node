### Installation

`yarn install`

`yarn build`

### Running locally

1. install PM2 (`npm i -g pm2`)
2. choose your ecosystem configuration file (eg. `ecosystem.config.kuba.js`)
3. `mv ecosystem.config.kuba.js ecosystem.config.js`
4. `mkdir dist/.db`
5. `mkdir dist/.secrets`
6. put `redstone-jwk.json` into `dist/.secrets`
7. `pm2 start ecosystem.config.js`

List all nodes:
`pm2 l`

Monit all nodes
`pm2 monit`

Stop all nodes
`pm2 stop ecosystem.config.js`

Restart all nodes
`pm2 restart ecosystem.config.js`

Check logs
`pm2 logs`

### Querying for state

```
POST http://localhost:3000/current-state
Content-Type: application/json

{
  "contractId": "B_FIQ0w_R-IHDZGx2j7X9C2IZEJl-SVJN3AKAnhwLk4"
}
```
