import DOMPurify from 'dompurify'
import { marked } from 'marked'

let hooked = false

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`)
}

/**
 * Renders untrusted markdown (LLM output, logged answers) to sanitized HTML.
 * Scripts, event handlers and dangerous URLs are removed by DOMPurify; links
 * open in a new tab and images are only allowed from this site.
 */
export function renderSafeMarkdown(text: string): string {
  if (!text) return ''
  // DOMPurify needs a DOM: chat content only exists client-side anyway.
  if (import.meta.server) return escapeHtml(text)

  if (!hooked) {
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer nofollow')
      }
      if (node.tagName === 'IMG' && !node.getAttribute('src')?.startsWith('/')) {
        node.remove()
      }
    })
    hooked = true
  }

  const html = marked.parse(text, { async: false, breaks: true, gfm: true })
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button', 'textarea', 'select'],
    FORBID_ATTR: ['style'],
  })
}
