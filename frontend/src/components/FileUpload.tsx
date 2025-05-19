import React, { useRef } from 'react';
import { Paperclip } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit. Please choose a smaller file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    onFileSelect(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`p-2 text-gray-400 rounded-lg transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:text-white hover:bg-gray-600'
        }`}
        title={
          disabled
            ? 'Remove current file to attach a new one'
            : 'Attach Excel or CSV file (max 10MB)'
        }
        type="button"
        disabled={disabled}
      >
        <Paperclip className="w-5 h-5" />
      </button>
    </div>
  );
}
