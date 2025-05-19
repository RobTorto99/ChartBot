import { Bot, User, File } from 'lucide-react';
import type { Message } from '../types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={`flex gap-4 mb-6 ${
        message.isBot ? 'justify-start' : 'justify-end'
      }`}
    >
      {message.isBot && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          message.isBot
            ? 'bg-gray-800 text-white'
            : 'bg-blue-500 text-white'
        }`}
      >
        <p className="text-sm">{message.text}</p>
        
        {message.attachment && (
          <div className="mt-2 flex items-center text-xs text-gray-300">
            <File className="w-4 h-4 mr-1" />
            <span>
              Archivo adjunto: <span className="font-semibold">{message.attachment.name}</span>
            </span>
          </div>
        )}

        {message.showChart && message.chartOptions && (
          <div className="my-4">
            <HighchartsReact
              highcharts={Highcharts}
              options={message.chartOptions}
            />
          </div>
        )}
        <span className="text-xs opacity-50 mt-1 block">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      {!message.isBot && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}
