// src/components/ChatInput.tsx
import React from 'react';
import { Send, Paintbrush2, CheckCircle, X } from 'lucide-react';
import { FileUpload } from './FileUpload';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent, file?: File, generateChart?: boolean) => Promise<void>;
}

export function ChatInput({ input, setInput, onSubmit }: ChatInputProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [generateChart, setGenerateChart] = React.useState<boolean>(true);

  const handleFileSelect = (file: File) => {
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      alert('Por favor, selecciona un archivo CSV o Excel (.csv, .xlsx, .xls)');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, selectedFile || undefined, generateChart);
    setInput('');
    setSelectedFile(null);
  };

  // Botón para “desmarcar” el archivo
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="border-t border-gray-700 bg-gray-800 p-4">
      {/* Se muestra sólo si hay un archivo seleccionado */}
      {selectedFile && (
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-white">
          {/* Icono de check en verde */}
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span>
            Archivo subido:
            <span className="ml-1 font-semibold">{selectedFile.name}</span>
          </span>
          {/* Botón para quitar el archivo */}
          <button
            onClick={handleRemoveFile}
            className="text-red-400 hover:text-red-500 p-1"
            title="Quitar archivo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
        
        {/* INPUT DE TEXTO */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            selectedFile
              ? "Describe lo que quieras sobre este archivo..."
              : "Escribe tu mensaje..."
          }
          className="w-full bg-gray-700 text-white rounded-lg pl-24 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* ZONA IZQUIERDA (BOTONES ADJUNTAR + PINCEL) */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Botón de subir archivo */}
          <FileUpload onFileSelect={handleFileSelect} disabled={!!selectedFile} />

          {/* Botón para activar/desactivar el gráfico */}
          <button
            type="button"
            onClick={() => setGenerateChart(!generateChart)}
            className={`
              p-1 rounded-full transition-colors
              ${generateChart
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-transparent text-gray-400 hover:bg-gray-600'
              }
            `}
            title="Generar gráfico"
          >
            <Paintbrush2 className="w-5 h-5" />
          </button>
        </div>

        {/* BOTÓN DE ENVIAR (A LA DERECHA) */}
        <button
          type="submit"
          className={`
            absolute right-2 top-1/2 -translate-y-1/2
            text-gray-400 hover:text-white p-2 rounded-lg transition-colors
            ${(!input.trim() && !selectedFile)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-600'
            }
          `}
          disabled={!input.trim() && !selectedFile}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
