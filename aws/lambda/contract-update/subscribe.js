const {initPubSub, subscribe} = require("warp-contracts-pubsub");
global.WebSocket = require('ws');

initPubSub();
async function sub() {
  const subscription = await subscribe('5Yt1IujBmOm1LSux9KDUTjCE7rJqepzP7gZKf_DyzWI', ({data}) => {
    console.log('new message', data);
  });
  console.log(subscription);

}

sub().then().catch((e) => {
  console.error(e);
})





