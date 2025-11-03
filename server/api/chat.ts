import OpenAI from 'openai'
import { readFile } from 'fs/promises'
import { join } from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT,
  organization: process.env.OPENAI_ORGANIZATION,
})

// Fallback responses for common questions
const fallbackResponses = {
  techStack: {
    en: 'My main tech stack includes frontend technologies like Vue.js, Nuxt.js, React, TypeScript, Tailwind CSS, D3.js, Vuetify, and Nuxt UI. For the backend, I work with Node.js, Express, Prisma, PostgreSQL, MongoDB, and Supabase. I also use tools like Git, Docker, Vercel, Netlify, Figma, and various CMS platforms. My preferred frameworks are Nuxt 4, Vue 3, and React 18+.',
    fr: 'Ma stack technique principale comprend des technologies frontend comme Vue.js, Nuxt.js, React, TypeScript, Tailwind CSS, D3.js, Vuetify et Nuxt UI. Pour le backend, je travaille avec Node.js, Express, Prisma, PostgreSQL, MongoDB et Supabase. J\'utilise aussi des outils comme Git, Docker, Vercel, Netlify, Figma et diverses plateformes CMS. Mes frameworks préférés sont Nuxt 4, Vue 3 et React 18+.',
  },
  education: {
    en: 'I have a diverse educational background. I started with a degree in Computer Science at Exia Cesi (2014-2016), then studied Sound Engineering at Abbey Road Institute (2016-2018). I came back to web development with a Fullstack program at O\'Clock School in 2022, focusing on Node.js and React. Currently, I\'m completing a DevOps applications developer program at Wild Code School (2023-2024) while doing an apprenticeship at Quantedsquare as a Fullstack web developer.',
    fr: 'J\'ai un parcours scolaire diversifié. J\'ai commencé par un diplôme en Informatique à Exia Cesi (2014-2016), puis j\'ai étudié l\'Ingénierie du Son à Abbey Road Institute (2016-2018). Je suis revenu au développement web avec une formation Fullstack à O\'Clock School en 2022, axée sur Node.js et React. Actuellement, je termine une formation de Concepteur développeur d\'applications DevOps à Wild Code School (2023-2024) tout en faisant un apprentissage chez Quantedsquare en tant que développeur web Fullstack.',
  },
  currentWork: {
    en: 'I\'m currently working at Quantedsquare, a web agency where I\'ve been a Fullstack web developer and consultant since 2023. I work on projects for startups and companies, including Crown and Odysway. I also do technical due diligence for investment funds, helping them assess the technical aspects of potential investments.',
    fr: 'Je travaille actuellement chez Quantedsquare, une agence web où je suis développeur web Fullstack et consultant depuis 2023. Je travaille sur des projets pour des startups et des entreprises, notamment Crown et Odysway. Je fais aussi de la diligence technique pour des fonds d\'investissement, en les aidant à évaluer les aspects techniques d\'investissements potentiels.',
  },
  projects: {
    en: 'My recent projects include Odysway, a full-stack web application for a travel agency that I worked on for 2 years. It uses Nuxt4, Vuetify, Supabase, SanityCMS, NuxtStudio, and Stripe. I completely redesigned and rebuilt the website, including the payment funnel, analytics dashboard, and CRM. Another major project is Crown, an eAuction platform for industries that I built from scratch over 1 year, featuring real-time bidding, notifications, charts, and dashboards. Both projects were done at Quantedsquare.',
    fr: 'Mes derniers projets incluent Odysway, une application web full-stack pour une agence de voyage sur laquelle j\'ai travaillé pendant 2 ans. Elle utilise Nuxt4, Vuetify, Supabase, SanityCMS, NuxtStudio et Stripe. J\'ai complètement redesigné et reconstruit le site web, y compris le tunnel de paiement, le tableau de bord analytique et le CRM. Un autre projet majeur est Crown, une plateforme d\'enchères électroniques pour les industries que j\'ai construite de zéro sur 1 an, avec des fonctionnalités de surenchère en temps réel, des notifications, des graphiques et des tableaux de bord. Les deux projets ont été réalisés chez Quantedsquare.',
  },
}

// Simple keyword matching for fallback responses
const getFallbackResponse = (message: string, locale: string = 'en'): string | null => {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('tech stack') || lowerMessage.includes('stack technique') || lowerMessage.includes('technologies') || lowerMessage.includes('technologie principale') || lowerMessage.includes('technology')) {
    return fallbackResponses.techStack[locale as keyof typeof fallbackResponses.techStack]
  }
  if (lowerMessage.includes('education') || lowerMessage.includes('educational') || lowerMessage.includes('parcours') || lowerMessage.includes('parcours scolaire') || lowerMessage.includes('formation') || lowerMessage.includes('background')) {
    return fallbackResponses.education[locale as keyof typeof fallbackResponses.education]
  }
  if (lowerMessage.includes('currently working') || lowerMessage.includes('current work') || lowerMessage.includes('currently work') || lowerMessage.includes('travaillez-vous actuellement') || lowerMessage.includes('travaille actuellement') || lowerMessage.includes('quantedsquare')) {
    return fallbackResponses.currentWork[locale as keyof typeof fallbackResponses.currentWork]
  }
  if (lowerMessage.includes('projects') || lowerMessage.includes('project') || lowerMessage.includes('projets') || lowerMessage.includes('projet') || lowerMessage.includes('odysway') || lowerMessage.includes('crown')) {
    return fallbackResponses.projects[locale as keyof typeof fallbackResponses.projects]
  }

  return null
}

export default defineEventHandler(async (event) => {
  try {
    const { message, locale = 'en' } = await readBody(event)

    if (!message || typeof message !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Message is required',
      })
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      const fallbackResponse = getFallbackResponse(message, locale)
      if (fallbackResponse) {
        return {
          response: fallbackResponse,
          source: 'fallback',
        }
      }

      return {
        response: locale === 'fr'
          ? 'Désolé, le service IA n\'est pas configuré pour le moment. Vous pouvez me contacter directement via le formulaire de contact pour toute question.'
          : 'Sorry, the AI service is not configured at the moment. You can contact me directly via the contact form for any questions.',
        source: 'fallback',
      }
    }

    // Try to use OpenAI API
    try {
      // Read the AI context file
      const contextPath = join(process.cwd(), 'content', 'ai-context.md')
      const context = await readFile(contextPath, 'utf-8')

      // Use the most cost-effective model for simple Q&A
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Most cost-effective model
        messages: [
          {
            role: 'system',
            content: context,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 300, // Limit tokens to control costs
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      })

      const response = completion.choices[0]?.message?.content

      if (!response) {
        throw new Error('No response from OpenAI')
      }
      console.log(response)
      return {
        response,
        usage: completion.usage, // Include usage for monitoring costs
        source: 'openai',
      }
    }
    catch (openaiError: any) {
      console.log(openaiError)
      console.warn('OpenAI API Error, using fallback:', openaiError.message)

      // Check if it's a quota/rate limit error
      if (openaiError.status === 429 || openaiError.message.includes('quota')) {
        const fallbackResponse = getFallbackResponse(message, locale)
        if (fallbackResponse) {
          return {
            response: fallbackResponse,
            source: 'fallback',
            note: locale === 'fr'
              ? 'Réponse automatique (service IA temporairement indisponible)'
              : 'Auto response (AI service temporarily unavailable)',
          }
        }
      }

      // Generic fallback for other errors
      return {
        response: locale === 'fr'
          ? 'Désolé, je rencontre un problème technique. Vous pouvez me contacter directement via le formulaire de contact.'
          : 'Sorry, I\'m experiencing a technical issue. You can contact me directly via the contact form.',
        source: 'fallback',
      }
    }
  }
  catch (error) {
    console.error('AI Chat Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process request',
    })
  }
})
