import { Sparkles } from 'lucide-react';

export function ChatHeader() {
  return (
    <header className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-blue-400" />
        <h1 className="text-xl font-semibold text-white">ChartBot</h1>
      </div>
    </header>
  );
}