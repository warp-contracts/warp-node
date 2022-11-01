module.exports = {
  success: (result) => {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(result),
    }
  },
  internalServerError: (msg) => {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        statusCode: 500,
        error: 'Internal Server Error',
        internalError: JSON.stringify(msg),
      }),
    }
  }
}