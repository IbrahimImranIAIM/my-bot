/* eslint-disable */
/* tslint:disable */
// This file defines the output schema for the createTicket action
import { z } from "@botpress/sdk"
export const output = {
  schema: z
    .object({
      ticketId: z.string().min(1),
    })
    .catchall(z.never()),
}


