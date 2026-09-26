import { initBotId } from 'botid/client/core'

// Vercel BotID: an invisible challenge attached to the chat requests, checked by
// server/api/chat.post.ts, so bots can't burn the Anthropic API credits.
export default defineNuxtPlugin({
  enforce: 'pre',
  setup() {
    initBotId({
      protect: [{ path: '/api/chat', method: 'POST' }],
    })
  },
})
