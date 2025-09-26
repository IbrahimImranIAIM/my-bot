/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Configuration = {
  /** Only set this config if you plan on signing your user key yourself. Key used to sign and verify user keys; JWT tokens with HS256 algorithm. */
  encryptionKey?: string;
  /** Only set this config if you want to listen on a webhook instead of the standard SSE stream. URL where all incoming and outgoing messages / events are sent to. */
  webhookUrl?: string;
  /** Secret forwarded to the webhook URL. */
  webhookSecret?: string;
};
