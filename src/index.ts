import * as bp from '.botpress'
import { retrieveAnswer } from './kb'

const bot = new bp.Bot({
  actions: {
    async 'create-support-ticket'(_ctx: any, input: { userName: string; userEmail: string; problemDescription: string }) {
      const body = {
        name: input.userName,
        email: input.userEmail,
        problem: input.problemDescription,
      }
      const endpoint = process.env.SUPPORT_API_ENDPOINT || 'https://iaimwork.free.beeceptor.com/'
      try {
        console.info('[ticket] POST', endpoint, body)
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        console.info('[ticket] response', res.status, res.statusText)
      } catch (_e) {
        console.error('[ticket] POST failed', _e)
      }
      const ticketId = 'TICKET-' + Math.random().toString(36).substr(2, 9)
      return { ticketId }
    },
  },
})


bot.on.message('text', async (props) => {
  const {
    conversation: { id: conversationId },
    ctx: { botId: userId },
  } = props;

  // text-only handler

  const userText = props.message.payload.text

  // Read conversation state first
  const supportState = await (props.client as any).getState({ type: 'conversation', id: conversationId, name: 'supportFlow' })
  const support = (supportState?.value as any) || {}
  const awaiting = support.awaitingLoginFixConfirm
  // If Autonomous Node asked to create ticket now (may have stored email/problem)
  if (support.createNow) {
    const emailFromState = typeof support.email === 'string' ? support.email : ''
    const problemFromState = typeof support.problem === 'string' ? support.problem : ''
    const emailMatch = (emailFromState || userText).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    const userEmail = emailMatch ? emailMatch[0] : ''
    const problemDescription = (problemFromState || userText.replace(userEmail, '').trim() || 'Login issue persists after troubleshooting.')
    const userName = 'User'
    const { ticketId } = await (bot as any).actions['create-support-ticket']({}, { userName, userEmail, problemDescription })
    await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: `Thank you. I've created ticket ${ticketId} for you. Our team will be in touch shortly.` } })
    await (props.client as any).setState({ type: 'conversation', id: conversationId, name: 'supportFlow', value: {} })
    return
  }
  if (awaiting) {
    const negative = /\b(no|not\s*yet|didn'?t|doesn'?t\s*work)\b/i.test(userText)
    const positive = /\b(yes|fixed|works|resolved)\b/i.test(userText)
    if (positive) {
      await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: 'Glad it helped! If you need anything else, let me know.' } })
      await (props.client as any).setState({ type: 'conversation', id: conversationId, name: 'supportFlow', value: {} })
      return
    }
    if (negative) {
      await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: "I'm sorry to hear that. I can create a support ticket for you. What is your email address and a brief description of the problem?" } })
      await (props.client as any).setState({ type: 'conversation', id: conversationId, name: 'supportFlow', value: { awaitingTicketInfo: true } })
      return
    }
    await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: 'Did the troubleshooting steps solve your problem? Please reply yes or no.' } })
    return
  }

  const awaitingTicket = support.awaitingTicketInfo
  if (awaitingTicket) {
    const emailMatch = userText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    const userEmail = emailMatch ? emailMatch[0] : ''
    const problemDescription = userText.replace(userEmail, '').trim() || 'Login issue persists after troubleshooting.'
    const userName = 'User'
    const { ticketId } = await (bot as any).actions['create-support-ticket']({}, { userName, userEmail, problemDescription })
    await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: `Thank you. I've created ticket ${ticketId} for you. Our team will be in touch shortly.` } })
    await (props.client as any).setState({ type: 'conversation', id: conversationId, name: 'supportFlow', value: {} })
    return
  }

  // Login issue new turn: search KB and send troubleshooting steps, then ask confirmation
  if (/\b(i\s*can'?t\s*log\s*in|login\s*issue|log\s*in\s*problem)\b/i.test(userText)) {
    const kb = retrieveAnswer('login issue')
    const troubleshooting = kb.item?.answer || 'Troubleshooting: 1) Check email/password 2) Reset password 3) Clear cache/incognito 4) Verify 2FA time sync.'
    await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: troubleshooting } })
    await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: 'Did any of those steps solve your problem?' } })
    await (props.client as any).setState({ type: 'conversation', id: conversationId, name: 'supportFlow', value: { awaitingLoginFixConfirm: true } })
    return
  }

  // If user explicitly asks to create a ticket outside of the login flow
  if (/(create|open|raise)\s+(a\s+)?(support\s+)?(ticket|case)/i.test(userText)) {
    await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: 'Sure — what is your email address and a brief description of the problem?' } })
    await (props.client as any).setState({ type: 'conversation', id: conversationId, name: 'supportFlow', value: { awaitingTicketInfo: true } })
    return
  }

  // General KB retrieval last
  const { item, score } = retrieveAnswer(userText)
  if (item && score >= 0.25) {
    await props.client.createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: item.answer } })
    return
  }

  

  await props.client.createMessage({
    conversationId,
    userId,
    tags: {},
    type: 'text',
    payload: { text: 'I dont know how to respond to that' },
  })
});

// File handler to index uploaded documents (like the example)
bot.on.message('file', async (props) => {
  const {
    conversation: { id: conversationId },
    ctx: { botId: userId },
  } = props
  const fileUrl = props.message.payload.fileUrl as string
  const fileName = (fileUrl?.split('/')?.pop() as string) || `file-${Date.now()}`
  await (props.client as any).uploadFile({ key: fileName, url: fileUrl, index: true })
  await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: `File received and indexed: ${fileName}` } })
})

export default bot
