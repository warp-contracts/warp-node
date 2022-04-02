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

### Endpoints
1. ehlo
```
http://localhost:[3001-3008]/ehlo
```

2. state
```
http://localhost:[3001-3008]/state?id=KT45jaf8n9UwgkEareWxPgLJk4oMWpI5NODgYVIF1fY
```

3. state with validity:
```
http://localhost:3001/state?id=KT45jaf8n9UwgkEareWxPgLJk4oMWpI5NODgYVIF1fY&validity=true
```

4. no snowball
```
http://localhost:3001/state?id=KT45jaf8n9UwgkEareWxPgLJk4oMWpI5NODgYVIF1fY&snowball=false
```
