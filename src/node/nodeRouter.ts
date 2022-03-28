import Router from "@koa/router";
import { gossipRoute } from "./routes/gossip";
import { infoRoute } from "./routes/info";
import { currentState } from "./routes/currentState";

const nodeRouter = new Router();

nodeRouter.get("/info", infoRoute);
nodeRouter.get("/current-state", currentState);
nodeRouter.get("/gossip", gossipRoute);

export default nodeRouter;
