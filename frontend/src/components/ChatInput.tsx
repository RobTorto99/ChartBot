// src/components/ChatInput.tsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { FileAttachmentComponent } from './FileAttachment';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent, file?: File) => void;
}

export function ChatInput({ input, setInput, onSubmit }: ChatInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    onSubmit(e, selectedFile || undefined);
    setInput('');
    setSelectedFile(null);
  };

  return (
    <div className="border-t border-gray-700 bg-gray-800 p-4">
      {selectedFile && (
        <div className="max-w-4xl mx-auto mb-4">
          <FileAttachmentComponent
            file={{
              name: selectedFile.name,
              type: selectedFile.type,
            }}
            onRemove={() => setSelectedFile(null)}
            isPreview
          />
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            selectedFile
              ? "Describe what you'd like to know about this file..."
              : "Type your message..."
          }
          className="w-full bg-gray-700 text-white rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <FileUpload onFileSelect={setSelectedFile} disabled={!!selectedFile} />
        </div>
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2 rounded-lg transition-colors ${
            !input.trim() && !selectedFile
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-600'
          }`}
          disabled={!input.trim() && !selectedFile}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
