# AI Chat Setup Guide

## Environment Variables

Add the following environment variable to your `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from: https://platform.openai.com/api-keys

## Cost Optimization Features

The AI chat implementation includes several cost optimization features:

1. **Model Selection**: Uses `gpt-3.5-turbo` (most cost-effective model)
2. **Token Limits**: Limited to 300 tokens per response
3. **Usage Monitoring**: Returns usage statistics for cost tracking
4. **Context Management**: Uses a single context file to minimize token usage
5. **Fallback System**: Local responses when API is unavailable or quota exceeded

## Components Created

- `app/components/home/AiChat.vue` - Main chat interface component
- `server/api/chat.ts` - API endpoint for OpenAI integration
- `content/ai-context.md` - Context file with information about Alex

## Features

- **Preset Questions**: 4 commonly asked questions for quick access
- **Bilingual Support**: Works in both English and French
- **Real-time Chat**: Interactive chat interface
- **Cost Monitoring**: Tracks API usage for budget management
- **Error Handling**: Graceful error handling with user-friendly messages
- **Fallback System**: Local responses when OpenAI API is unavailable or quota exceeded
- **Smart Responses**: Keyword-based matching for common questions

## Usage

The AI chat replaces the previous FAQ section and provides:
- Instant answers about services, pricing, and experience
- Personalized responses based on the context file
- Interactive chat experience for visitors
- Cost-effective AI integration

## Customization

You can customize the AI responses by editing `content/ai-context.md` with your specific information, services, and personality.
