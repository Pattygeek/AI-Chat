import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { ChatCompletionContentPart, ChatCompletionMessageParam } from 'openai/resources/chat/completions';

interface MessageAttachment {
  type: 'image' | 'text';
  data: string; // base64 for images, content for text
  name: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: MessageAttachment[];
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
}

const app = express();
const PORT = process.env.PORT || 3001;

// System prompt to define AI behavior
const SYSTEM_PROMPT = `You are a helpful, friendly, and knowledgeable AI assistant.

Guidelines:
- Be conversational and engaging while remaining informative
- Use emojis occasionally to add warmth to your responses 😊
- Format responses clearly using markdown when appropriate (bold, lists, code blocks, etc.)
- Break down complex topics into digestible explanations
- Be concise but thorough - provide enough detail to be helpful without being overwhelming
- If you don't know something, say so honestly
- When providing code examples, use proper syntax highlighting with code blocks
- When analyzing images, describe what you see and answer any questions about them
- When given text files, read and analyze the content as requested`;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'AI Chat Backend is running' });
});

// Helper function to format messages with attachments for OpenAI
function formatMessagesForOpenAI(messages: ChatMessage[]): ChatCompletionMessageParam[] {
  const formattedMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  for (const msg of messages) {
    if (msg.role === 'assistant') {
      formattedMessages.push({
        role: 'assistant',
        content: msg.content,
      });
    } else {
      // User message - may have attachments
      if (msg.attachments && msg.attachments.length > 0) {
        const contentParts: ChatCompletionContentPart[] = [];

        // Add attachments first
        for (const attachment of msg.attachments) {
          if (attachment.type === 'image') {
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: attachment.data, // base64 data URL
                detail: 'auto',
              },
            });
          } else if (attachment.type === 'text') {
            // For text files, include content as text
            contentParts.push({
              type: 'text',
              text: `[File: ${attachment.name}]\n${attachment.data}`,
            });
          }
        }

        // Add the message text
        if (msg.content) {
          contentParts.push({
            type: 'text',
            text: msg.content,
          });
        }

        formattedMessages.push({
          role: 'user',
          content: contentParts,
        });
      } else {
        formattedMessages.push({
          role: 'user',
          content: msg.content,
        });
      }
    }
  }

  return formattedMessages;
}

// Streaming chat endpoint
app.post('/api/chat/stream', async (req: Request<object, object, ChatRequestBody>, res: Response) => {
  const { messages, model = 'gpt-4o' } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: 'OpenAI API key not configured' });
    return;
  }

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const formattedMessages = formatMessagesForOpenAI(messages);

    // Create streaming chat completion
    const stream = await openai.chat.completions.create({
      model,
      messages: formattedMessages,
      stream: true,
    });

    // Handle streaming response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
      }

      // Check if stream is complete
      if (chunk.choices[0]?.finish_reason === 'stop') {
        res.write(`data: ${JSON.stringify({ type: 'done', usage: chunk.usage })}\n\n`);
      }
    }

    res.end();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
    res.end();
  }

  // Handle client disconnect
  req.on('close', () => {
    // Stream will be garbage collected
  });
});

// Non-streaming chat endpoint (fallback)
app.post('/api/chat', async (req: Request<object, object, ChatRequestBody>, res: Response) => {
  const { messages, model = 'gpt-4o' } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: 'OpenAI API key not configured' });
    return;
  }

  try {
    const formattedMessages = formatMessagesForOpenAI(messages);

    const response = await openai.chat.completions.create({
      model,
      messages: formattedMessages,
    });

    res.json({
      content: response.choices[0].message.content,
      usage: response.usage,
      model: response.model,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY not set. Chat endpoints will not work.');
  }
});
