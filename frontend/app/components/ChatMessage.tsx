"use client";

import ReactMarkdown from "react-markdown";

export interface MessageAttachment {
  id: string;
  type: "image" | "text" | "pdf";
  name: string;
  preview?: string; // base64 for images, content for text
  pageImages?: string[]; // For PDFs: array of base64 page images
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex items-start gap-3 max-w-[85%] md:max-w-[70%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
          }`}
        >
          {isUser ? "U" : "AI"}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
          }`}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="rounded-lg overflow-hidden bg-black/10 dark:bg-white/10"
                >
                  {attachment.type === "image" || attachment.type === "pdf" ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className="max-h-48 max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 opacity-70"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                          clipRule="evenodd"
                        />
                        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                      </svg>
                      <span className="text-sm">{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message content */}
          {message.content && (
            <div className={`text-sm md:text-base leading-relaxed prose prose-sm max-w-none ${
              isUser
                ? "prose-invert prose-p:text-white prose-strong:text-white prose-em:text-white prose-code:text-white prose-headings:text-white prose-a:text-blue-200"
                : "dark:prose-invert prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:bg-gray-200 dark:prose-code:bg-gray-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-200 dark:prose-pre:bg-gray-700"
            }`}>
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          <p
            className={`text-xs mt-2 ${
              isUser
                ? "text-blue-200"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
