export type QaItem = {
  question: string
  answer: string
  tags: string[]
}

// Simple in-memory KB. In production, prefer Botpress Knowledge or a vector store.
export const KNOWLEDGE_BASE: QaItem[] = [
  { question: 'What are your pricing tiers?', answer: 'We offer Free, Pro ($19/mo), and Enterprise (custom).', tags: ['pricing'] },
  { question: 'Do you have annual discounts?', answer: 'Yes, 2 months free when billed annually.', tags: ['pricing'] },
  { question: 'Is there a free trial?', answer: 'Pro includes a 14-day free trial without a credit card.', tags: ['pricing'] },
  { question: 'What features are in the Free plan?', answer: 'Basic chat, 1 workspace, community support.', tags: ['features','pricing'] },
  { question: 'What features are in the Pro plan?', answer: 'Advanced automations, API access, priority support.', tags: ['features','pricing'] },
  { question: 'What is included in Enterprise?', answer: 'SLA, SSO, dedicated support, custom limits.', tags: ['features','pricing'] },
  { question: 'How do I reset my password?', answer: 'Use “Forgot password” on the login screen; check your email for a reset link.', tags: ['issues','login'] },
  { question: 'I cannot log in', answer: 'Check email/password, reset password, clear cache, try incognito, verify 2FA time sync.', tags: ['issues','login'] },
  { question: 'I am seeing 2FA problems', answer: 'Ensure device time is accurate; resync your authenticator app.', tags: ['issues','login','2fa'] },
  { question: 'How to contact support?', answer: 'Reach us via in-app chat or support@example.com.', tags: ['support'] },
  { question: 'Where is the API documentation?', answer: 'Visit our developer portal under Docs > API.', tags: ['features','api'] },
  { question: 'Do you support webhooks?', answer: 'Yes, configure inbound/outbound webhooks in settings.', tags: ['features','api'] },
  { question: 'What integrations are available?', answer: 'Slack, Teams, Telegram, and custom via REST APIs.', tags: ['features','integrations'] },
  { question: 'How do I export my data?', answer: 'Go to Settings > Data Export and follow the prompts.', tags: ['features','data'] },
  { question: 'Common troubleshooting steps', answer: 'Refresh page, clear cache, try another browser, check status page.', tags: ['issues'] },
  { question: 'Where can I see system status?', answer: 'Check our status page for ongoing incidents.', tags: ['features','status'] },
]

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function retrieveAnswer(query: string): { item: QaItem | null; score: number } {
  const qTokens = normalize(query)
  let best: { item: QaItem | null; score: number } = { item: null, score: 0 }
  for (const item of KNOWLEDGE_BASE) {
    const corpus = normalize(item.question + ' ' + item.answer + ' ' + item.tags.join(' '))
    const overlap = qTokens.filter((t) => corpus.includes(t))
    const score = overlap.length / Math.max(1, qTokens.length)
    if (score > best.score) best = { item, score }
  }
  return best
}


