/* eslint-disable */
/* tslint:disable */
// Action definition for createTicket
import * as sdk from "@botpress/sdk"
import * as input from "./input"
import * as output from "./output"

export * as input from "./input"
export * as output from "./output"

export const createTicket = {
  input: input.input,
  output: output.output,
  title: "Create Support Ticket",
  description: "Create a support ticket via mock API and return a ticketId",
  billable: false,
  cacheable: false,
  attributes: {},
} satisfies sdk.ActionDefinition


