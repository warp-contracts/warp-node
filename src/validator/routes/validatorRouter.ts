import Router from "@koa/router";
import {otherPeers, peersRoute} from "./peersRoute";
import {registerRoute} from "./registerRoute";
import {unregisterRoute} from "./unregisterRoute";

const validatorRouter = new Router({prefix: '/network'});

validatorRouter.get("/peers", peersRoute);
validatorRouter.get("/other-peers", otherPeers);
validatorRouter.post("/register", registerRoute);
validatorRouter.post("/unregister", unregisterRoute);

export default validatorRouter;
