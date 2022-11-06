const { handler } = require("./index");

(async () => {
  const result = await handler({
    queryStringParameters: {
      contractTxId: "5Yt1IujBmOm1LSux9KDUTjCE7rJqepzP7gZKf_DyzWI"
    }
  });
})();

