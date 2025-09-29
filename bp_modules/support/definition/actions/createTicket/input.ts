/* eslint-disable */
/* tslint:disable */
// This file defines the input schema for the createTicket action
import { z } from "@botpress/sdk"
export const input = {
  schema: z
    .object({
      userName: z.string().min(1),
      userEmail: z.string().email(),
      problemDescription: z.string().min(1),
    })
    .catchall(z.never()),
}


