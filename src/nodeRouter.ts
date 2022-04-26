import Router from "@koa/router";
import { gossipRoute } from "./routes/gossip";
import {ehloRoute} from "./routes/ehlo";
import {state} from "./routes/state";

const nodeRouter = new Router();

nodeRouter.get("/ehlo", ehloRoute);
nodeRouter.get("/state", state);
nodeRouter.get("/gossip", gossipRoute);

export default nodeRouter;
