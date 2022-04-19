FROM node:16

RUN mkdir /app
WORKDIR /app

# Installing required npm packages
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install

# Copying all files
COPY . .

# Building app
RUN yarn build

RUN mkdir ./dist/.db
RUN mkdir ./dist/.secrets
COPY .secrets/wallet.json ./dist/.secrets

# Running redstone node
ENTRYPOINT ["node", "dist/init.js", "--port=8080", "--testnet='false'", "--networkId='redstone_network'", "--networkContractId='_dK3pzMY4b4VEG43suCw10mOwTTq8BrDlaszbQd5iHE'"]
CMD ["--url='http://localhost'"]