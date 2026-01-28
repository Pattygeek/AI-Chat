# Potential Improvements and Enhancements

A roadmap of features and improvements for the AI Chat application.

## Core Functionality

- [ ] **Conversation history/persistence** - Save chats to localStorage or a database so users can resume conversations
- [ ] **Multiple chat sessions** - Sidebar to manage and switch between different conversations
- [ ] **Model selection** - Let users choose between GPT-4o, GPT-4o-mini, etc.
- [ ] **Regenerate response** - Button to regenerate the last AI response
- [ ] **Edit messages** - Allow users to edit their previous messages and regenerate from that point
- [ ] **Copy message** - Button to copy AI responses to clipboard ✅
- [ ] **Stop generation** - Button to stop streaming mid-response (abort controller is already in place)

## UI/UX Enhancements

- [ ] **Code syntax highlighting** - Use a library like `react-syntax-highlighter` for code blocks
- [ ] **Manual dark/light mode toggle** - Currently uses system preference only
- [ ] **Typing indicators** - Show "AI is typing..." animation
- [ ] **Message reactions** - Thumbs up/down for feedback
- [ ] **Search messages** - Search through conversation history
- [ ] **Export chat** - Download conversation as markdown or PDF

## Advanced Features

- [ ] **Voice input** - Speech-to-text using Web Speech API
- [ ] **Text-to-speech** - Read AI responses aloud
- [ ] **System prompt customization** - Let users define their own AI persona
- [ ] **Token/cost tracking** - Display token usage per message
- [ ] **Rate limiting** - Prevent abuse on the backend
- [ ] **User authentication** - Login system for personalized experience

## Technical Improvements

- [ ] **Error retry logic** - Automatic retry on failed requests
- [ ] **Offline support** - PWA with service worker
- [ ] **WebSocket connection** - More efficient than SSE for bidirectional communication
- [ ] **Message queue** - Handle rapid message sending gracefully
