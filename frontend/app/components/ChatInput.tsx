"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker - use local worker to avoid CORS issues
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

export interface Attachment {
  id: string;
  file: File;
  type: "image" | "text" | "pdf";
  preview?: string;
  base64?: string;
  pageImages?: string[]; // For PDFs: array of base64 page images
}

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_TEXT_TYPES = ["text/plain", "text/markdown", "application/json", "text/csv"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB for PDFs
const MAX_PDF_PAGES = 10; // Limit pages to avoid token overload

async function convertPdfToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const images: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 1.5; // Good balance between quality and size
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    // Convert to base64 JPEG (smaller than PNG)
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    images.push(imageData);
  }

  return images;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          alert(`File ${file.name} is too large. Max size is 20MB.`);
          continue;
        }

        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        const isText = ALLOWED_TEXT_TYPES.includes(file.type) || file.name.endsWith('.txt') || file.name.endsWith('.md');
        const isPdf = file.type === "application/pdf" || file.name.endsWith('.pdf');

        if (!isImage && !isText && !isPdf) {
          alert(`File type ${file.type || 'unknown'} is not supported.`);
          continue;
        }

        const attachment: Attachment = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          type: isPdf ? "pdf" : isImage ? "image" : "text",
        };

        if (isPdf) {
          try {
            const pageImages = await convertPdfToImages(file);
            attachment.pageImages = pageImages;
            attachment.preview = pageImages[0]; // First page as preview
            setAttachments(prev => [...prev, attachment]);
          } catch (error) {
            console.error("Error processing PDF:", error);
            alert(`Failed to process PDF: ${file.name}`);
          }
        } else if (isImage) {
          const reader = new FileReader();
          reader.onload = (event) => {
            attachment.preview = event.target?.result as string;
            attachment.base64 = event.target?.result as string;
            setAttachments(prev => [...prev, attachment]);
          };
          reader.readAsDataURL(file);
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            attachment.preview = event.target?.result as string;
            setAttachments(prev => [...prev, attachment]);
          };
          reader.readAsText(file);
        }
      }
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = () => {
    if ((input.trim() || attachments.length > 0) && !disabled && !isProcessing) {
      onSend(input.trim(), attachments);
      setInput("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing file...
          </div>
        )}

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative group bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
              >
                {attachment.type === "image" || attachment.type === "pdf" ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachment.preview}
                      alt="attachment"
                      className="h-20 w-20 object-cover"
                    />
                    {attachment.type === "pdf" && attachment.pageImages && (
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {attachment.pageImages.length} pg
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-20 w-20 flex flex-col items-center justify-center p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-8 h-8 text-gray-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                        clipRule="evenodd"
                      />
                      <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                    </svg>
                    <span className="text-xs text-gray-500 truncate w-full text-center mt-1">
                      {attachment.file.name.slice(0, 10)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove attachment"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3 h-3"
                  >
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_TEXT_TYPES, '.txt', '.md', '.pdf', 'application/pdf'].join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isProcessing}
            className="flex-shrink-0 w-10 h-10 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors"
            aria-label="Attach file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835a2.25 2.25 0 0 1-3.182-3.182l9.166-9.165a.75.75 0 0 1 1.06 1.061l-9.165 9.165a.75.75 0 0 0 1.06 1.06L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            rows={1}
            className="flex-1 bg-transparent my-auto resize-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base min-h-[24px] max-h-[200px]"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || isProcessing || (!input.trim() && attachments.length === 0)}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
