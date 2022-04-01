pm2 stop ecosystem.config.js
rm -rf dist/.db/ && mkdir dist/.db
git pull
yarn install
yarn build
pm2 start ecosystem.config.js
