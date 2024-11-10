import React, { useState } from 'react';
import { MessageSquare, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Chat } from '../types';

interface ChatTrayProps {
  chats: Chat[];
  activeChat: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
}

export function ChatTray({
  chats,
  activeChat,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onRenameChat,
}: ChatTrayProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = () => {
    if (editingChatId && editTitle.trim()) {
      onRenameChat(editingChatId, editTitle.trim());
      setEditingChatId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <button
        onClick={onNewChat}
        className="m-4 flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Chat
      </button>
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group relative px-4 py-3 hover:bg-gray-700 transition-colors ${
              activeChat === chat.id ? 'bg-gray-700' : ''
            }`}
          >
            {editingChatId === chat.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-gray-600 text-white text-sm px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onChatSelect(chat.id)}
                className="w-full text-left flex items-center gap-3"
              >
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{chat.title}</p>
                  <p className="text-xs text-gray-400">
                    {chat.lastUpdated.toLocaleDateString()}
                  </p>
                </div>
              </button>
            )}
            {!editingChatId && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                <button
                  onClick={() => handleStartEdit(chat)}
                  className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                  title="Rename chat"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteChat(chat.id)}
                  className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}