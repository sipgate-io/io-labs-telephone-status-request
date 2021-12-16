import "reflect-metadata";
import * as dotenv from "dotenv";
import { createWebhookModule, WebhookResponse } from "sipgateio";

dotenv.config();

const MAX_CUSTOMERID_DTMF_INPUT_LENGTH = 8;

enum OrderStatus {
  RECEIVED,
  PENDING,
  FULLFILLED,
  CANCELED,
}

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

const getAnnouncementByOrderStatus = (orderStatus: OrderStatus): string => {
  switch (orderStatus) {
    case OrderStatus.RECEIVED:
      return "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/orderstatus_received.wav?raw=true";
    case OrderStatus.PENDING:
      return "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/orderstatus_pending.wav?raw=true";
    case OrderStatus.FULLFILLED:
      return "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/orderstatus_fullfilled.wav?raw=true";
    case OrderStatus.CANCELED:
      return "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/orderstatus_canceled.wav?raw=true";
    default:
      return "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/error.wav?raw=true";
  }
};

const getAnnouncementByCustomerId = (customerId: string): string => {
  console.log(`getAnnouncementByCustomerId ${customerId}`);
  return getAnnouncementByOrderStatus(OrderStatus.PENDING);
};

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
        announcement:
          "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/request_customerid.wav?raw=true",
      });
    });

    webhookServer.onData((dataEvent) => {
      const customerId = dataEvent.dtmf;
      if (customerId.length === MAX_CUSTOMERID_DTMF_INPUT_LENGTH) {
        console.log(`The caller provided a valid customer id: ${customerId} `);

        return WebhookResponse.gatherDTMF({
          maxDigits: 1,
          timeout: 0,
          announcement: getAnnouncementByCustomerId(customerId),
        });
      }
      return WebhookResponse.hangUpCall();
    });
  });
