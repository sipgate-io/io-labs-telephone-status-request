import * as dotenv from "dotenv";
import { createWebhookModule, WebhookResponse } from "sipgateio";

dotenv.config();

const MAX_CUSTOMERID_DTMF_INPUT_LENGTH = 8;

if (!process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS) {
  console.error(
    "ERROR: You need to set a server address to receive webhook events!\n",
  );
  process.exit();
}

if (!process.env.SIPGATE_WEBHOOK_SERVER_PORT) {
  console.error(
    "ERROR: You need to set a server port to receive webhook events!\n",
  );
  process.exit();
}

const SERVER_ADDRESS = process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS;
const PORT = process.env.SIPGATE_WEBHOOK_SERVER_PORT;

createWebhookModule()
  .createServer({
    port: PORT,
    serverAddress: SERVER_ADDRESS,
  })
  .then((webhookServer) => {
    webhookServer.onNewCall((newCallEvent) => {
      console.log(`New call from ${newCallEvent.from} to ${newCallEvent.to}`);
      return WebhookResponse.gatherDTMF({
        maxDigits: MAX_CUSTOMERID_DTMF_INPUT_LENGTH,
        timeout: 5000,
        // needs to be changed
        announcement:
          "https://github.com/sipgate-io/io-labs-complex-ivr/blob/main/static/welcome.wav?raw=true",
      });
    });

    webhookServer.onData((dataEvent) => {
      const customerId = dataEvent.dtmf;
      if (customerId.length === MAX_CUSTOMERID_DTMF_INPUT_LENGTH) {
        console.log(`The caller provided a valid customer id: ${customerId} `);
        return WebhookResponse.gatherDTMF({
          maxDigits: 1,
          timeout: 0,
          // needs to be changed
          announcement:
            "https://github.com/sipgate-io/io-labs-complex-ivr/blob/main/static/request.wav?raw=true",
        });
      }
      return WebhookResponse.hangUpCall();
    });
  });
