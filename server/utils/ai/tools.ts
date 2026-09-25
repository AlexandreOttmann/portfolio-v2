import type Anthropic from '@anthropic-ai/sdk'
import type { H3Event } from 'h3'
import { z } from 'zod/v4'
import { getArticle, getProject, listProjects, searchPortfolio, type Locale } from './knowledge'
import { PILOT_PAGES, type ChatUiPayload, type PilotPage } from '../../../shared/types/chat'

/**
 * Agent tools. Each tool returns two things:
 * - `content`: what the model reads (tool_result),
 * - `ui`: an optional payload the chat widget renders as a component
 *   (project cards, article card, contact card) instead of plain text.
 */

interface ToolOutput {
  content: string
  ui?: ChatUiPayload
  isError?: boolean
}

interface ToolDefinition<S extends z.ZodType> {
  name: string
  description: string
  input: S
  run: (input: z.infer<S>, ctx: { event: H3Event, locale: Locale }) => Promise<ToolOutput>
}

function defineTool<S extends z.ZodType>(tool: ToolDefinition<S>) {
  return tool
}

const pilotPages = Object.keys(PILOT_PAGES) as [PilotPage, ...PilotPage[]]
const pilotTargets = [...new Set(Object.values(PILOT_PAGES).flatMap(page => page.targets))] as [string, ...string[]]

const PAGE_LABELS: Record<Locale, Record<PilotPage, string>> = {
  fr: { 'home': 'l\'accueil', 'works': 'les projets', 'writing': 'les articles', 'about': 'la page À propos', 'contact': 'la page Contact', 'red-wire': 'le fil rouge' },
  en: { 'home': 'the home page', 'works': 'the projects', 'writing': 'the articles', 'about': 'the About page', 'contact': 'the Contact page', 'red-wire': 'the red wire page' },
}

const tools = [
  defineTool({
    name: 'get_project_details',
    description: 'Get the full story of one of Alex\'s projects (context, role, what he built, stack, link) and show its card to the visitor. Use it whenever the visitor asks about a specific project or experience (Odysway, Crown, Quanted Square, EONI, Oni Auction…).',
    input: z.object({
      slug: z.string().describe('Project slug, as listed in the "Projects" section of your context (e.g. "odysway").'),
    }),
    async run({ slug }, { event, locale }) {
      const project = await getProject(event, locale, slug)
      if (!project) return { content: `No project with slug "${slug}".` }
      const { details, ...card } = project
      return {
        content: JSON.stringify({ ...card, details }),
        ui: { type: 'projects', projects: [card] },
      }
    },
  }),
  defineTool({
    name: 'list_projects',
    description: 'List Alex\'s projects as visual cards, optionally filtered by a technology. Use it for questions like "show me your projects", "what have you built with Nuxt?".',
    input: z.object({
      technology: z.string().optional().describe('Only keep projects whose stack or summary mentions this technology (case-insensitive).'),
      featured_only: z.boolean().optional().describe('Only keep featured projects.'),
    }),
    async run({ technology, featured_only }, { event, locale }) {
      const needle = technology?.toLowerCase()
      const projects = (await listProjects(event, locale))
        .filter(p => !featured_only || p.featured)
        .filter(p => !needle || p.stack.some(s => s.toLowerCase().includes(needle)) || p.summary.toLowerCase().includes(needle))
        .sort((a, b) => b.release.localeCompare(a.release))
      return {
        content: projects.length ? JSON.stringify(projects) : 'No matching project.',
        ui: projects.length ? { type: 'projects', projects } : undefined,
      }
    },
  }),
  defineTool({
    name: 'get_article',
    description: 'Read one of Alex\'s articles (personal writing: travels, photography, his dog Yuzu, what he is working on) or the "red-wire" page describing his current personal project, and show a link card to it.',
    input: z.object({
      slug: z.string().describe('Article slug from the "Articles" section of your context (e.g. "japon", "yuzu", "red-wire").'),
    }),
    async run({ slug }, { event, locale }) {
      const article = await getArticle(event, locale, slug)
      if (!article) return { content: `No article with slug "${slug}".` }
      const { content, ...card } = article
      return {
        content: JSON.stringify({ ...card, content }),
        ui: { type: 'article', article: card },
      }
    },
  }),
  defineTool({
    name: 'search_portfolio',
    description: 'Full-text search across every page, project write-up and article of the portfolio. Use it when the answer is not in your context and no other tool fits (e.g. a specific technology, client, or detail).',
    input: z.object({
      query: z.string().min(2).max(200).describe('Keywords to look for, in the visitor\'s language.'),
    }),
    async run({ query }, { event, locale }) {
      const hits = await searchPortfolio(event, locale, query)
      return { content: hits.length ? JSON.stringify(hits) : 'No result.' }
    },
  }),
  defineTool({
    name: 'show_on_site',
    description: `Take the visitor to a page of the website, optionally scrolling to and highlighting a section. The chat shrinks to the side so they can see it. Use it when the visitor asks to see, visit or be shown something on the site, or when a quick visual tour answers better than text. Sections by page: ${Object.entries(PILOT_PAGES).map(([page, { targets }]) => `${page}: ${targets.join(', ') || '(whole page)'}`).join('; ')}.`,
    input: z.object({
      page: z.enum(pilotPages),
      section: z.enum(pilotTargets).optional().describe('A section of that page to scroll to and highlight.'),
    }),
    async run({ page, section }, { locale }) {
      const targets: readonly string[] = PILOT_PAGES[page].targets
      if (section && !targets.includes(section)) {
        return { content: `Section "${section}" is not on page "${page}". Available: ${targets.join(', ') || 'none'}.`, isError: true }
      }
      const label = (locale === 'fr' ? 'Direction ' : 'Going to ') + PAGE_LABELS[locale][page]
      return {
        content: `The visitor now sees ${page}${section ? `, with the "${section}" section highlighted` : ''}. Refer to what is on screen in one or two sentences.`,
        ui: { type: 'site-action', action: { kind: 'navigate', page, target: section, label } },
      }
    },
  }),
  defineTool({
    name: 'open_project_on_site',
    description: 'Open a project\'s detail panel on the website (image, stack, full write-up) while the chat moves to the side. Use it when the visitor wants to see a project, or after describing a project when showing it adds value.',
    input: z.object({
      slug: z.string().describe('Project slug from the "Projects" section of your context.'),
    }),
    async run({ slug }, { event, locale }) {
      const project = (await listProjects(event, locale)).find(p => p.slug === slug.toLowerCase())
      if (!project) return { content: `No project with slug "${slug}".`, isError: true }
      return {
        content: `The ${project.name} panel is now open on the site. Refer to it briefly instead of repeating its content.`,
        ui: { type: 'site-action', action: { kind: 'open-project', stem: project.stem, label: (locale === 'fr' ? 'Ouverture de ' : 'Opening ') + project.name } },
      }
    },
  }),
  defineTool({
    name: 'show_contact_options',
    description: 'Show the visitor a card with the ways to reach Alex (contact form, book a call, LinkedIn, CV download). Use it when the visitor wants to hire, meet or contact Alex, asks for his CV, or when you cannot answer a question.',
    input: z.object({}),
    async run() {
      return {
        content: 'The contact card (contact form, call booking link, LinkedIn, CV download) is now displayed to the visitor. Do not repeat the links.',
        ui: { type: 'contact' },
      }
    },
  }),
]

/** Tool definitions sent to the API. Stable order and content (prompt cache prefix). */
export const toolDefinitions: Anthropic.Beta.BetaTool[] = tools.map((tool) => {
  const { $schema: _, ...inputSchema } = z.toJSONSchema(tool.input)
  return {
    name: tool.name,
    description: tool.description,
    input_schema: inputSchema as Anthropic.Beta.BetaTool.InputSchema,
    eager_input_streaming: true,
  }
})

export async function runTool(name: string, rawInput: unknown, ctx: { event: H3Event, locale: Locale }): Promise<ToolOutput> {
  const tool = tools.find(t => t.name === name)
  if (!tool) return { content: `Unknown tool "${name}".`, isError: true }

  // With eager input streaming the API does not validate tool inputs: do it here.
  const parsed = tool.input.safeParse(rawInput)
  if (!parsed.success) {
    return { content: `Invalid input: ${parsed.error.message}`, isError: true }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await tool.run(parsed.data as any, ctx)
  }
  catch (error) {
    console.error(`[AI Chat] Tool ${name} failed:`, error)
    return { content: 'The tool failed. Answer from your context instead.', isError: true }
  }
}
