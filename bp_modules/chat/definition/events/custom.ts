/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

import { z } from "@botpress/sdk";
export const custom = {
  title: "Custom Event",
  description: "Custom event sent from the chat client to the bot",
  attributes: {},
  schema: z
    .object({
      userId: z.string(),
      conversationId: z.string(),
      payload: z.record(z.string(), z.any()),
    })
    .catchall(z.never()),
};
