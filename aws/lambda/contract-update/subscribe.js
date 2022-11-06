const {initPubSub, subscribe} = require("warp-contracts-pubsub");
global.WebSocket = require('ws');

initPubSub();
async function sub() {
  const subscription = await subscribe('EdTDa1qwnu_g1GMHOkP9X1Hn2qZt65P5VKyMXkLDaTA', ({data}) => {
    console.log(' ==== new message ==== ');
    console.dir(data);
  });
  console.log('waiting for messages...');
}

sub().then().catch((e) => {
  console.error(e);
})





