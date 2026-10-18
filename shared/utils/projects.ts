/**
 * Project slugs, shared by the site (/works/<slug> pages) and the AI agent's
 * tools, so both always name a project the same way.
 */

const PROJECT_DIR_RE = /projects\/((?:(\d+)\.)?([^/]+))\/(?:data|content)$/

/** 'fr/projects/12.oniauction/data' → { dir: '12.oniauction', order: '12', name: 'oniauction' } */
export function projectDir(stem = '') {
  const match = PROJECT_DIR_RE.exec(stem)
  return { dir: match?.[1] ?? stem, order: match?.[2], name: (match?.[3] ?? stem).toLowerCase() }
}

/**
 * Slug of each project, in the collection's order: the folder name without its
 * order prefix; when two folders share a name (5.portfolio, 8.portfolio), the
 * later one gets its order appended (portfolio-8).
 */
export function projectSlugs(stems: string[]): string[] {
  const seen = new Set<string>()
  return stems.map((stem) => {
    const { order, name } = projectDir(stem)
    const slug = seen.has(name) && order ? `${name}-${order}` : name
    seen.add(slug)
    return slug
  })
}
