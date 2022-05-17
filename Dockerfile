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

# Running node
ENTRYPOINT ["node", "dist/init.js"]
CMD ["--port=8080", "--testnet='false'", "--networkId='redstone_network'", "--networkContractId='FxjoXsxQyuknaqaCV2Si7sq0TF3taBb8uTRmXmC6FQs'", "--url='http://localhost'"]