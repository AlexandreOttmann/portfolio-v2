import type { H3Event } from 'h3'
import { queryCollection, queryCollectionSearchSections } from '@nuxt/content/server'

/**
 * Knowledge base of the portfolio assistant.
 *
 * Nuxt Content collections are the single source of truth: the assistant reads
 * the same files the website renders. Nothing is duplicated or pre-ingested.
 *
 * - `buildProfileContext` compiles the always-in-context profile (persona,
 *   about, timeline, stack, project index, FAQ). It goes into the cached
 *   system prompt, so its output must be byte-stable for a given content set.
 * - The other functions back the agent's tools (details are fetched on demand).
 */

export type Locale = 'fr' | 'en'

export interface ProjectSummary {
  slug: string
  stem: string
  name: string
  release: string
  summary: string
  stack: string[]
  image: string
  link: string
  featured: boolean
}

export interface ArticleSummary {
  slug: string
  title: string
  description: string
  date: string
  image?: string
  path: string
  tags: string[]
}

export interface SearchHit {
  source: string
  title: string
  snippet: string
  score: number
}

interface RawDoc {
  stem?: string
  path?: string
  title?: string
  description?: string
  rawbody?: string
  meta?: Record<string, unknown>
  [key: string]: unknown
}

// Content only changes on deploy, so one build per server instance is enough.
const profileCache = new Map<Locale, Promise<string>>()

// 'fr/projects/3.odysway/data' → { dir: '3.odysway', name: 'odysway' }
const PROJECT_DIR_RE = /projects\/((?:(\d+)\.)?([^/]+))\/(?:data|content)$/

function projectDir(stem = '') {
  const match = PROJECT_DIR_RE.exec(stem)
  return { dir: match?.[1] ?? stem, order: match?.[2], name: (match?.[3] ?? stem).toLowerCase() }
}

function lastSegment(stemOrPath = ''): string {
  return stemOrPath.split('/').filter(Boolean).pop() ?? stemOrPath
}

/**
 * Removes frontmatter and MDC component syntax (`::about`, `#title` slots…)
 * from raw markdown so the model reads prose, not markup.
 */
export function cleanMarkdown(raw = ''): string {
  return raw
    .replace(/^---\n[\s\S]*?\n---\n?/, '')
    .split('\n')
    .filter(line => !/^\s*:{2,}[\w-]*\s*$/.test(line) && !/^\s*#[a-z_]+\s*$/i.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Collection names are built dynamically from the locale, so the typed overloads cannot be used here.
async function all(event: H3Event, collection: string): Promise<RawDoc[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = await queryCollection(event, collection as any).order('stem', 'ASC').all()
  return docs as unknown as RawDoc[]
}

async function first(event: H3Event, collection: string): Promise<RawDoc | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await queryCollection(event, collection as any).first()
  return (doc as unknown as RawDoc) ?? null
}

async function listProjectsWithDir(event: H3Event, locale: Locale) {
  const docs = await all(event, `projects_${locale}`)
  const seen = new Set<string>()
  return docs.map((doc) => {
    const { dir, order, name } = projectDir(doc.stem)
    // Two folders can share a name (e.g. 5.portfolio and 8.portfolio): keep slugs unique.
    const slug = seen.has(name) && order ? `${name}-${order}` : name
    seen.add(slug)
    return { dir, project: toProjectSummary(doc, slug) }
  })
}

function toProjectSummary(doc: RawDoc, slug: string): ProjectSummary {
  return {
    slug,
    stem: doc.stem ?? '',
    name: String(doc.name ?? ''),
    release: String(doc.release ?? ''),
    summary: String(doc.content ?? ''),
    stack: Array.isArray(doc.stack) ? doc.stack.map(String) : [],
    image: String(doc.image ?? ''),
    link: String(doc.link ?? ''),
    featured: Boolean(doc.featured),
  }
}

export async function listProjects(event: H3Event, locale: Locale): Promise<ProjectSummary[]> {
  return (await listProjectsWithDir(event, locale)).map(({ project }) => project)
}

export async function getProject(event: H3Event, locale: Locale, slug: string) {
  const entry = (await listProjectsWithDir(event, locale)).find(({ project }) => project.slug === slug.toLowerCase())
  if (!entry) return null

  const contents = await all(event, `project_content_${locale}`)
  const content = contents.find(doc => projectDir(doc.stem).dir === entry.dir)
  return { ...entry.project, details: cleanMarkdown(content?.rawbody) }
}

export async function listArticles(event: H3Event, locale: Locale): Promise<ArticleSummary[]> {
  const docs = await all(event, `articles_${locale}`)
  return docs.map(doc => ({
    slug: lastSegment(doc.stem),
    title: String(doc.title ?? ''),
    description: String(doc.description ?? ''),
    date: String(doc.date ?? ''),
    image: typeof doc.image === 'string' ? doc.image : undefined,
    path: doc.path ?? '',
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
  }))
}

/** Articles, plus the "red wire" page (current personal work, English only). */
export async function getArticle(event: H3Event, locale: Locale, slug: string) {
  if (slug === 'red-wire') {
    const doc = await first(event, 'red_wire')
    if (!doc) return null
    return {
      slug,
      title: doc.title ?? 'Red wire',
      description: doc.description ?? '',
      date: String(doc.date ?? ''),
      path: `/${locale}/red-wire`,
      tags: [],
      content: cleanMarkdown(doc.rawbody),
    }
  }

  const docs = await all(event, `articles_${locale}`)
  const doc = docs.find(d => lastSegment(d.stem) === slug)
  if (!doc) return null
  const [summary] = (await listArticles(event, locale)).filter(a => a.slug === slug)
  return { ...summary!, content: cleanMarkdown(doc.rawbody) }
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'est', 'il', 'a', 'que', 'qui', 'quoi', 'sur', 'pour', 'avec', 'dans', 'son', 'sa', 'ses',
  'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'is', 'he', 'his', 'what', 'which', 'who', 'with', 'for', 'to', 'does', 'did', 'alex', 'alexandre',
])

function tokenize(text: string): string[] {
  return normalize(text).split(/[^a-z0-9+#.]+/).filter(t => t.length > 1 && !STOP_WORDS.has(t))
}

/**
 * Keyword search over every section of the portfolio's markdown (projects,
 * articles, pages). The corpus is small, so a scored scan over Nuxt Content's
 * own sections is fast and predictable. This is the single retrieval entry
 * point: swapping it for hybrid vector search does not touch the agent.
 */
export async function searchPortfolio(event: H3Event, locale: Locale, query: string, limit = 5): Promise<SearchHit[]> {
  const terms = [...new Set(tokenize(query))]
  if (terms.length === 0) return []

  const collections = [`project_content_${locale}`, `articles_${locale}`, `content_${locale}`, 'red_wire']
  const sections = (await Promise.all(collections.map(async (collection) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = await queryCollectionSearchSections(event, collection as any)
      return found.map(section => ({ ...section, collection }))
    }
    catch {
      return []
    }
  }))).flat()

  return sections
    .map((section) => {
      const title = [...(section.titles ?? []), section.title].join(' › ')
      const haystack = normalize(`${title} ${section.content}`)
      const score = terms.reduce((acc, term) => {
        const hits = haystack.split(term).length - 1
        return acc + (hits > 0 ? 1 + Math.log(hits) : 0)
      }, 0) / terms.length
      return {
        source: section.id,
        title,
        snippet: section.content.slice(0, 700),
        score: Math.round(score * 100) / 100,
      }
    })
    .filter(hit => hit.score > 0 && hit.snippet.trim().length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * The profile that is always in the system prompt. Deterministic ordering and
 * no timestamps: any byte change here invalidates the prompt cache.
 */
export function buildProfileContext(event: H3Event, locale: Locale): Promise<string> {
  let cached = profileCache.get(locale)
  if (!cached) {
    cached = compileProfile(event, locale).catch((error) => {
      profileCache.delete(locale)
      throw error
    })
    profileCache.set(locale, cached)
  }
  return cached
}

async function compileProfile(event: H3Event, locale: Locale): Promise<string> {
  const [persona, pages, timelineDoc, stackDoc, faqDoc, projects, articles] = await Promise.all([
    first(event, 'ai_context'),
    all(event, `content_${locale}`),
    first(event, `timeline_${locale}`),
    first(event, 'stack'),
    first(event, `faq_${locale}`),
    listProjects(event, locale),
    listArticles(event, locale),
  ])

  const sections: string[] = []

  sections.push(`## Persona and agent-only facts\n\n${cleanMarkdown(persona?.rawbody)}`)

  const pageText = pages
    .map(page => ({ title: page.title, body: cleanMarkdown(page.rawbody) }))
    .filter(page => page.body.length > 0)
    .map(page => `### ${page.title}\n\n${page.body}`)
  if (pageText.length) sections.push(`## Website pages\n\n${pageText.join('\n\n')}`)

  const timeline = (timelineDoc?.meta?.body ?? []) as Array<{ year: number, title: string, description: string }>
  if (timeline.length) {
    sections.push(`## Timeline\n\n${timeline.map(e => `- ${e.year} — ${e.title}: ${e.description}`).join('\n')}`)
  }

  const stack = (stackDoc?.items ?? []) as Array<{ name: string }>
  if (stack.length) sections.push(`## Daily tools and technologies\n\n${stack.map(s => s.name).join(', ')}`)

  sections.push(`## Projects (call get_project_details for the full story)\n\n${projects
    .map(p => `- ${p.name} (slug: ${p.slug}, ${p.release}${p.featured ? ', featured' : ''}) — ${p.summary} Stack: ${p.stack.join(', ') || 'n/a'}. Link: ${p.link}`)
    .join('\n')}`)

  sections.push(`## Articles (call get_article to read one)\n\n${[
    ...articles.map(a => `- ${a.title} (slug: ${a.slug}, ${a.date}) — ${a.description}`),
    '- Red wire (slug: red-wire) — The personal project Alex is currently building, in detail.',
  ].join('\n')}`)

  const faq = (faqDoc?.faqQuestions ?? []) as Array<{ title: string, questions: Array<{ label: string, content: string }> }>
  if (faq.length) {
    sections.push(`## FAQ\n\n${faq
      .flatMap(group => group.questions.map(q => `- [${group.title}] ${q.label} ${q.content}`))
      .join('\n')}`)
  }

  return sections.join('\n\n')
}
