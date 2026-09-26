/**
 * Welcome questions shown in the chat. Shared with the server: a first message
 * that is exactly one of these gets a cached answer (see answer-cache.ts).
 */
export const PRESET_QUESTIONS = [
  { id: 'tech-stack', icon: 'lucide:code', fr: 'Quelle est sa stack technique principale ?', en: 'What is his main tech stack?' },
  { id: 'projects', icon: 'lucide:folder-kanban', fr: 'Montre-moi ses projets IA et temps réel', en: 'Show me his AI and realtime projects' },
  { id: 'current-work', icon: 'lucide:briefcase', fr: 'Sur quoi travaille-t-il en ce moment ?', en: 'What is he working on right now?' },
  { id: 'hire', icon: 'lucide:handshake', fr: 'Comment travailler avec Alex ?', en: 'How can I work with Alex?' },
] as const
