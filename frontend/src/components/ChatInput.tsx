// src/components/ChatInput.tsx

import React from 'react';
import { Send } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { FileAttachmentComponent } from './FileAttachment';
import { parseFile } from '../utils/fileParser'; // Asegúrate de tener esta función
import type { FileAttachment as FileAttachmentType } from '../types';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent, file?: FileAttachmentType) => Promise<void>;
}

export function ChatInput({ input, setInput, onSubmit }: ChatInputProps) {
  const [selectedFile, setSelectedFile] = React.useState<FileAttachmentType | null>(null);

  const handleFileSelect = async (file: File) => {
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      alert('Por favor, selecciona un archivo CSV o Excel (.csv, .xlsx, .xls)');
      return;
    }

    try {
      const parsedFile = await parseFile(file);
      setSelectedFile(parsedFile);
    } catch (error: any) {
      console.error('Error al parsear el archivo:', error);
      alert('Error al parsear el archivo. Por favor, verifica que el archivo esté correcto.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e, selectedFile || undefined);
    setInput('');
    setSelectedFile(null);
  };

  return (
    <div className="border-t border-gray-700 bg-gray-800 p-4">
      {selectedFile && (
        <div className="max-w-4xl mx-auto mb-4">
          <FileAttachmentComponent
            file={selectedFile}
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
          <FileUpload onFileSelect={handleFileSelect} disabled={!!selectedFile} />
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
