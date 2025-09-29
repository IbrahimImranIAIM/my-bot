import * as bp from '.botpress'

// Inlined KB + simple retriever (personality: friendly SaaS Support)
type QaItem = { question: string; answer: string; tags: string[] }
const KNOWLEDGE_BASE: QaItem[] = [
  { question: 'What are your pricing tiers?', answer: 'We offer Free, Pro ($19/mo), and Enterprise (custom).', tags: ['pricing'] },
  { question: 'Do you have annual discounts?', answer: 'Yes, 2 months free when billed annually.', tags: ['pricing'] },
  { question: 'Is there a free trial?', answer: 'Pro includes a 14-day free trial without a credit card.', tags: ['pricing'] },
  { question: 'What features are in the Free plan?', answer: 'Basic chat, 1 workspace, community support.', tags: ['features','pricing'] },
  { question: 'What features are in the Pro plan?', answer: 'Advanced automations, API access, priority support.', tags: ['features','pricing'] },
  { question: 'What is included in Enterprise?', answer: 'SLA, SSO, dedicated support, custom limits.', tags: ['features','pricing'] },
  { question: 'How do I reset my password?', answer: 'Use “Forgot password” on the login screen; check your email for a reset link.', tags: ['issues','login'] },
  { question: 'I cannot log in', answer: 'Check email/password, reset password, clear cache, try incognito, verify 2FA time sync.', tags: ['issues','login'] },
  { question: 'I am seeing 2FA problems', answer: 'Ensure device time is accurate; resync your authenticator app.', tags: ['issues','login','2fa'] },
  { question: 'How to contact support?', answer: 'Reach us via in-app chat or support@saas.example.', tags: ['support'] },
  { question: 'Where is the API documentation?', answer: 'Visit our developer portal under Docs > API.', tags: ['features','api'] },
  { question: 'Do you support webhooks?', answer: 'Yes, configure inbound/outbound webhooks in settings.', tags: ['features','api'] },
  { question: 'What integrations are available?', answer: 'Slack, Teams, Telegram, and custom via REST APIs.', tags: ['features','integrations'] },
  { question: 'How do I export my data?', answer: 'Go to Settings > Data Export and follow the prompts.', tags: ['features','data'] },
  { question: 'Common troubleshooting steps', answer: 'Refresh page, clear cache, try another browser, check status page.', tags: ['issues'] },
  { question: 'Where can I see system status?', answer: 'Check our status page for ongoing incidents.', tags: ['features','status'] },
]
const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
function retrieveAnswer(query: string): { item: QaItem | null; score: number } {
  const q = normalize(query)
  let best: { item: QaItem | null; score: number } = { item: null, score: 0 }
  for (const it of KNOWLEDGE_BASE) {
    const corpus = normalize(it.question + ' ' + it.answer + ' ' + it.tags.join(' '))
    const overlap = q.filter((t) => corpus.includes(t))
    const score = overlap.length / Math.max(1, q.length)
    if (score > best.score) best = { item: it, score }
  }
  return best
}

async function createSupportTicketImpl(input: { userName: string; userEmail: string; problemDescription: string }) {
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
}

const bot = new bp.Bot({
  actions: {
    async 'create-support-ticket'(_ctx: any, input: { userName: string; userEmail: string; problemDescription: string }) {
      return await createSupportTicketImpl(input)
    },
    async createSupportTicket(_ctx: any, input: { userName: string; userEmail: string; problemDescription: string }) {
      return await createSupportTicketImpl(input)
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
  const supportState = 
  await (props.client as any).getState({ type: 'conversation', id: conversationId, name: 'supportFlow' })
  const support = (supportState?.value as any) || {}
  // One-time SaaS greeting per conversation
  const greetState = await (props.client as any).getState({ type: 'conversation', id: conversationId, name: 'saasGreeting' })
  if (!(greetState?.value as any)?.greeted) {
    await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: 'Hi! You’re chatting with SaaS Support. How can I help you today?' } })
    await (props.client as any).setState({ type: 'conversation', id: conversationId, name: 'saasGreeting', value: { greeted: true } })
  }
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
    const emailMatch = userText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    const userEmail = emailMatch ? emailMatch[0] : ''
    const cleaned = userText
      .replace(/(please|kindly)\s*/gi, '')
      .replace(/(create|open|raise)\s+(a\s+)?(support\s+)?(ticket|case)/gi, '')
      .replace(userEmail, '')
      .trim()
    const problemDescription = cleaned || 'No description provided.'

    if (userEmail) {
      const userName = 'User'
      const { ticketId } = await (bot as any).actions['create-support-ticket']({}, { userName, userEmail, problemDescription })
      await (props.client as any).createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text: `Thank you. I've created ticket ${ticketId} for you. Our team will be in touch shortly.` } })
    } else {
      await (props.client as any).createMessage({
        conversationId,
        userId,
        tags: {},
        type: 'text',
        payload: {
          text: 'To create a ticket in one step, please send your email followed by a brief description, for example: me@example.com App crashes on login.',
        },
      })
    }
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
