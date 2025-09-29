import { BotDefinition } from "@botpress/sdk";
import chat from "./bp_modules/chat";

export default new BotDefinition({})
  .addIntegration(chat, { enabled: true, configuration: {} });