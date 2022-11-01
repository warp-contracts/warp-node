const { handler } = require("./index");

(async () => {
  const result = await handler({
    "Records": [
      {
        "EventSource": "aws:sns",
        "EventVersion": "1.0",
        "EventSubscriptionArn": "arn:aws:sns:eu-north-1:731675056359:WarpContractUpdate:ef5d4015-cf87-4a32-9b8e-a2d5a8d0c5e6",
        "Sns": {
          "Type": "Notification",
          "MessageId": "067d8ffb-6081-5c87-b5b1-d4238eaaa1db",
          "TopicArn": "arn:aws:sns:eu-north-1:731675056359:WarpContractUpdate",
          "Subject": null,
          "Message": "{\n  \"contractTxId\": \"5Yt1IujBmOm1LSux9KDUTjCE7rJqepzP7gZKf_DyzWI\",\n  \"evaluationOptions\": {\n    \"allowBigInt\": true\n  }\n}",
          "Timestamp": "2022-10-30T21:26:03.453Z",
          "SignatureVersion": "1",
          "Signature": "3MnhOsiKYYdgVVgb9Rcf4sM8qtRUEuiVyUWl2Sb5KXjvuk2pJb5ci96dUIqC2EYLmTFtwJ0HXT8RJfU7IK+qodIHX0i803chNLSKHi+FAfhdmoWHwmD5TfGRpM+lWY09ZOPA1sTX0HIKBpYtvaEgwKKqXKDAfHTVaFe8n+rHQxjC8xDGD84jOzHPKEHxBBWC0m9LQLOATwVn1FD2qVRIQ3xLNa2l75RMDNWJXMY384LbO/NuQuhJKLHgUbO0+MuqJQrnR9g9pBupJMWTTbPWimd6v2VMgN0NahEWR1eeS7XimmqUpmQ7wSkvkyYV2615m6nunw6CkZ4vN7PiHJRm8w==",
          "SigningCertUrl": "https://sns.eu-north-1.amazonaws.com/SimpleNotificationService-56e67fcb41f6fec09b0196692625d385.pem",
          "UnsubscribeUrl": "https://sns.eu-north-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-north-1:731675056359:WarpContractUpdate:ef5d4015-cf87-4a32-9b8e-a2d5a8d0c5e6",
          "MessageAttributes": {}
        }
      }
    ]
  });

  console.dir(result);
})();

