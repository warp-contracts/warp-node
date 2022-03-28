import Router from "@koa/router";
import { gossipRoute } from "./routes/gossip";
import { currentState } from "./routes/currentState";
import {ehloRoute} from "./routes/ehlo";

const nodeRouter = new Router();

nodeRouter.get("/ehlo", ehloRoute);
nodeRouter.get("/current-state", currentState);
nodeRouter.get("/gossip", gossipRoute);

export default nodeRouter;
