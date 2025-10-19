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
  services: {
    en: 'I offer a range of services including web design, web development, branding, and photography. I specialize in modern web technologies like Vue.js, Nuxt.js, React, and Node.js. I can also help with SEO and social media marketing.',
    fr: 'Je propose principalement des services de développement web et mobile, mais aussi de design et de consulting web. Mon objectif est de vous aider à créer des produits de qualité, qui répondent à vos besoins et à ceux de vos utilisateurs.',
  },
  pricing: {
    en: 'The cost of a project depends on many factors, such as the size of the project, the features, the development time, etc. The initial amount of my web services starts at €2,000, with an average between €3,000 and €10,000. For any other design or consulting service, I usually charge €450 per day.',
    fr: 'Le coût d\'un projet dépend de nombreux facteurs, tels que la taille du projet, les fonctionnalités, le temps de développement, etc. Le montant initial de mes services web commence à 2000€, avec une moyenne comprise entre 3000€ et 10000€. Pour tout autre service de design ou de consulting, je facture généralement 450€ par jour.',
  },
  timeline: {
    en: 'It\'s difficult to give an exact estimate, as each project is different, but the majority of my past work has taken between 2 weeks and 2 months.',
    fr: 'Il est difficile de donner une estimation précise, car chaque projet est différent, mais la majorité de mes travaux passés ont pris entre 2 semaines et 2 mois.',
  },
  hobbies: {
    en: 'I love what I do, so I usually spend a lot of time working on personal projects, photography, etc. I\'m also a big sports fan. I often go to the gym and I recently started climbing!',
    fr: 'J\'adore ce que je fais, donc je passe généralement beaucoup de temps à travailler sur des projets personnels, la photographie, etc. Je suis aussi un grand accro au sport. Je vais souvent à la salle de sport et j\'ai récemment commencé l\'escalade !',
  },
}

// Simple keyword matching for fallback responses
const getFallbackResponse = (message: string, locale: string = 'en'): string | null => {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('propose')) {
    return fallbackResponses.services[locale as keyof typeof fallbackResponses.services]
  }
  if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('coût') || lowerMessage.includes('tarif')) {
    return fallbackResponses.pricing[locale as keyof typeof fallbackResponses.pricing]
  }
  if (lowerMessage.includes('time') || lowerMessage.includes('duration') || lowerMessage.includes('temps') || lowerMessage.includes('durée')) {
    return fallbackResponses.timeline[locale as keyof typeof fallbackResponses.timeline]
  }
  if (lowerMessage.includes('hobby') || lowerMessage.includes('passion') || lowerMessage.includes('sport') || lowerMessage.includes('loisir')) {
    return fallbackResponses.hobbies[locale as keyof typeof fallbackResponses.hobbies]
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
