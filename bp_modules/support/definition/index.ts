/* eslint-disable */
/* tslint:disable */
// Integration definition for support
import * as sdk from "@botpress/sdk"
import { actions } from "./actions"

export default {
  name: "support",
  version: ">=0.0.0 <1.0.0",
  title: "Support",
  description: "Support utilities (create ticket)",
  iconUrl: "",
  readme: "",
  configuration: {
    schema: sdk.z.object({}),
  },
  channels: {},
  actions,
  events: {},
  states: {},
  entities: {},
  interfaces: {},
} satisfies sdk.IntegrationDefinition


