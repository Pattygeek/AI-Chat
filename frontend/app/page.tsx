"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage, { Message, MessageAttachment } from "./components/ChatMessage";
import ChatInput, { Attachment } from "./components/ChatInput";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

let messageIdCounter = 0;
const generateId = () => `msg-${++messageIdCounter}-${Math.random().toString(36).slice(2, 11)}`;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleSendMessage = useCallback(async (content: string, attachments: Attachment[] = []) => {
    // Convert attachments to message attachments format
    const messageAttachments: MessageAttachment[] = attachments.map(att => ({
      id: att.id,
      type: att.type,
      name: att.file.name,
      preview: att.type === "image" ? att.base64 : att.preview,
      pageImages: att.pageImages,
    }));

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setStreamingContent("");

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Prepare messages for API, including attachments
      const apiMessages = updatedMessages.map((msg) => {
        const apiMsg: {
          role: string;
          content: string;
          attachments?: { type: string; data: string; name: string }[];
        } = {
          role: msg.role,
          content: msg.content,
        };

        if (msg.attachments && msg.attachments.length > 0) {
          apiMsg.attachments = [];
          for (const att of msg.attachments) {
            if (att.type === "pdf" && att.pageImages) {
              // For PDFs, send each page as a separate image
              att.pageImages.forEach((pageImage, index) => {
                apiMsg.attachments!.push({
                  type: "image",
                  data: pageImage,
                  name: `${att.name} (page ${index + 1})`,
                });
              });
            } else {
              apiMsg.attachments!.push({
                type: att.type === "pdf" ? "image" : att.type,
                data: att.preview || "",
                name: att.name,
              });
            }
          }
        }

        return apiMsg;
      });

      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: apiMessages,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "content") {
                  accumulatedContent += data.content;
                  setStreamingContent(accumulatedContent);
                } else if (data.type === "done") {
                  // Finalize the assistant message
                  const aiMessage: Message = {
                    id: generateId(),
                    role: "assistant",
                    content: accumulatedContent,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, aiMessage]);
                  setStreamingContent("");
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // Request was cancelled, don't show error
        return;
      }

      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: `Sorry, there was an error: ${(error as Error).message}. Please make sure the backend server is running.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages]);

  const handleNewChat = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setStreamingContent("");
    setIsLoading(false);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="w-6 h-6"
              >
                <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
                <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Chat
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by GPT-4o
              </p>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            New Chat
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-8 h-8"
                >
                  <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
                  <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to AI Chat
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                Start a conversation with the AI. Ask questions, share images, or upload text files!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  "Explain quantum computing",
                  "Help me write a poem",
                  "What can you help me with?",
                  "Tell me a joke",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSendMessage(suggestion, [])}
                    className="px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {streamingContent && (
                <ChatMessage
                  message={{
                    id: "streaming",
                    role: "assistant",
                    content: streamingContent,
                    timestamp: new Date(),
                  }}
                />
              )}
              {isLoading && !streamingContent && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-medium text-white">
                      AI
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

      {/* Input Area */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder="Message AI..."
      />
    </div>
  );
}
