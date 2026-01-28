import { Message } from "../components/ChatMessage";

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const SESSIONS_KEY = "ai-chat-sessions";
const ACTIVE_SESSION_KEY = "ai-chat-active-session";

// Generate unique session ID
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Generate title from first user message
export function generateTitle(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= 30) return trimmed;
  return trimmed.slice(0, 30) + "...";
}

// Load all sessions from localStorage
export function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    if (!data) return [];

    const sessions = JSON.parse(data) as ChatSession[];
    // Sort by updatedAt descending (most recent first)
    return sessions.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

// Save a session to localStorage
export function saveSession(session: ChatSession): void {
  if (typeof window === "undefined") return;

  const sessions = loadSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);

  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

// Delete a session from localStorage
export function deleteSession(id: string): void {
  if (typeof window === "undefined") return;

  const sessions = loadSessions();
  const filtered = sessions.filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));

  // If deleting active session, clear active session
  if (getActiveSessionId() === id) {
    clearActiveSessionId();
  }
}

// Get a specific session by ID
export function getSession(id: string): ChatSession | null {
  const sessions = loadSessions();
  return sessions.find(s => s.id === id) || null;
}

// Create a new empty session
export function createNewSession(): ChatSession {
  const now = new Date().toISOString();
  return {
    id: generateSessionId(),
    title: "New Chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

// Get active session ID
export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

// Set active session ID
export function setActiveSessionId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

// Clear active session ID
export function clearActiveSessionId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}
