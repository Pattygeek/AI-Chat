"use client";

import { useMemo } from "react";
import { ChatSession } from "../lib/storage";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface GroupedSessions {
  [key: string]: ChatSession[];
}

// Define the order of date groups
const GROUP_ORDER = ["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days"];

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: GroupedSessions = {};

    sessions.forEach((session) => {
      const date = new Date(session.updatedAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      let groupKey: string;
      if (diffDays === 0) {
        groupKey = "Today";
      } else if (diffDays === 1) {
        groupKey = "Yesterday";
      } else if (diffDays < 7) {
        groupKey = "Previous 7 Days";
      } else if (diffDays < 30) {
        groupKey = "Previous 30 Days";
      } else {
        groupKey = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(session);
    });

    return groups;
  }, [sessions]);

  // Get ordered group keys
  const orderedGroups = useMemo(() => {
    const keys = Object.keys(groupedSessions);
    return keys.sort((a, b) => {
      const aIndex = GROUP_ORDER.indexOf(a);
      const bIndex = GROUP_ORDER.indexOf(b);

      // If both are in the predefined order, sort by that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is in predefined order, it comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // Otherwise, sort by date (newer months first)
      return 0; // Keep original order for month-year groups (already sorted by session date)
    });
  }, [groupedSessions]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-72 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Chats</h2>
          <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
              No conversations yet
            </p>
          ) : (
            <div className="px-2 pb-4">
              {orderedGroups.map((groupName) => (
                <div key={groupName} className="mb-4">
                  {/* Date Group Header */}
                  <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {groupName}
                  </h3>
                  {/* Sessions in this group */}
                  <ul>
                    {groupedSessions[groupName].map((session) => (
                      <li key={session.id} className="mb-1">
                        <button
                          onClick={() => {
                            onSelectSession(session.id);
                            onClose();
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group flex items-start justify-between gap-2 ${
                            activeSessionId === session.id
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <p className="text-sm font-medium truncate flex-1 min-w-0">
                            {session.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                            aria-label="Delete conversation"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
