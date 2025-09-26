import * as bp from '.botpress'

const bot = new bp.Bot({
  actions: {},
})


bot.on.message("*", async (props) => {
  const {
    conversation: { id: conversationId },
    ctx: { botId: userId },
  } = props;

  if (props.message.type !== "text") {
    await props.client.createMessage({
      conversationId,
      userId,
      tags: {},
      type: "text",
      payload: {
        text: "Sorry, I can only respond to text messages.",
      },
    });
    return;
  }

  await props.client.createMessage({
    conversationId,
    userId,
    tags: {},
    type: "text",
    payload: {
      text: `You said: ${props.message.payload.text}`,
    },
  });
});

export default bot
