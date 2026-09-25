import { z } from 'zod/v4'
import { buildProfileContext } from '../utils/ai/knowledge'
import { buildSystemPrompt } from '../utils/ai/prompt'
import { runTool, toolDefinitions } from '../utils/ai/tools'

/**
 * Dev-only (or AI_CHAT_DEBUG=1): inspect what the assistant sees, without
 * calling the model.
 *   /api/chat-debug?locale=fr                          → system prompt + tools
 *   /api/chat-debug?locale=fr&tool=search_portfolio&input={"query":"kafka"}
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev && process.env.AI_CHAT_DEBUG !== '1') throw createError({ statusCode: 404 })

  const query = z.object({
    locale: z.enum(['fr', 'en']).default('fr'),
    tool: z.string().optional(),
    input: z.string().optional(),
  }).parse(getQuery(event))

  if (query.tool) {
    return runTool(query.tool, JSON.parse(query.input ?? '{}'), { event, locale: query.locale })
  }

  const system = buildSystemPrompt(query.locale, await buildProfileContext(event, query.locale))
  return {
    approxTokens: Math.round(system.length / 3.5),
    tools: toolDefinitions,
    system,
  }
})
