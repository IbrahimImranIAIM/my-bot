import { BotDefinition } from "@botpress/sdk";
// CI demo: no-op change to trigger pipeline
import chat from "./bp_modules/chat";

export default new BotDefinition({}).addIntegration(chat, {
  enabled: true,
  configuration: {},
});