import * as path from "path";
import {Knex} from "knex";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import {LoggerFactory, RedStoneLogger} from "redstone-smartweave";
import {TsLogFactory} from "redstone-smartweave/lib/cjs/logging/node/TsLogFactory";
import {connect} from "../db/connect";
import validatorRouter from "./routes/validatorRouter";
import {initArweave} from "../node/arweave";
import Arweave from "arweave";

require("dotenv").config();

const compress = require('koa-compress');
const cors = require('@koa/cors');

async function init(db: Knex) {
  if (!(await db.schema.hasTable("peers"))) {
    await db.schema.createTable("peers", (table) => {
      table.string("id", 64).primary();
      table.string("address").notNullable().unique().index();
      table.string("status").notNullable().index();
      table.json("metrics");
      table.timestamp("registerTime").notNullable();
    });
  }
}

declare module "koa" {
  interface BaseContext {
    networkDb: Knex;
    gatewayDb: Knex;
    logger: RedStoneLogger;
    gatewayLogger: RedStoneLogger;
    arweave: Arweave;
  }
}

(async () => {
  const port = parseInt((process.env.PORT || 5666).toString());
  const networkId = `Network_${port}`;

  LoggerFactory.use(new TsLogFactory());
  LoggerFactory.INST.logLevel("info");
  LoggerFactory.INST.logLevel("debug", "network");

  const networkLogger = LoggerFactory.INST.create("network");
  networkLogger.info(`Starting`);

  const app = new Koa();
  const db = connect(port, "network", path.join("db", "network"));
  await init(db);

  const arweave = initArweave();
  app.context.db = db;
  app.context.logger = networkLogger;
  app.context.arweave = arweave;

  app.use(cors());
  app.use(bodyParser());
  app.use(compress({
    threshold: 2048,
    gzip: {
      flush: require('zlib').constants.Z_SYNC_FLUSH
    },
    deflate: {
      flush: require('zlib').constants.Z_SYNC_FLUSH,
    },
    br: false // disable brotli
  }))
  app.use(validatorRouter.routes());
  app.use(validatorRouter.allowedMethods());
  app.listen(port);
  networkLogger.info(`Listening on port ${port}`);

})();
