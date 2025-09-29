/* eslint-disable */
/* tslint:disable */
// Integration package entry
import * as sdk from "@botpress/sdk"
import definition from "./definition"

export default {
  type: "integration",
  id: "support",
  uri: undefined,
  name: "support",
  version: ">=0.0.0 <1.0.0",
  definition,
} satisfies sdk.IntegrationPackage


