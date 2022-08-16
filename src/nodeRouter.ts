import Router from "@koa/router";
import {gossipRoute} from "./routes/gossip";
import {ehloRoute} from "./routes/ehlo";
import {state} from "./routes/state";
import {walletBalances} from "./routes/balances";
import {allStates} from "./routes/allStates";

const nodeRouter = new Router();

nodeRouter.get("/ehlo", ehloRoute);
nodeRouter.get("/state", state);
nodeRouter.get("/gossip", gossipRoute);

nodeRouter.get("/balances", walletBalances);
nodeRouter.get("/all-states", allStates);

export default nodeRouter;
