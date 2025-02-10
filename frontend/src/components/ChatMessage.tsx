// src/components/ChatMessage.tsx

import { Bot, User } from 'lucide-react';
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
        {message.showChart && message.chartOptions && ( // este es el canvas del chat
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
/*
// src/components/ChatMessage.tsx
import React from 'react';
import { Bot, User } from 'lucide-react';
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

      
        {message.attachmentName && (
          <div className="mt-2 bg-gray-700 p-2 rounded">
            <p className="text-sm">
              Archivo subido: <span className="font-semibold">{message.attachmentName}</span>
            </p>

            
            {message.attachmentPreview && message.attachmentPreview.length > 0 && (
              <table className="w-full text-sm text-white mt-2">
                <thead>
                  <tr>
                    {message.attachmentPreview[0].map((header, i) => (
                      <th key={i} className="border-b border-gray-600 px-2 py-1">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {message.attachmentPreview.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border-b border-gray-600 px-2 py-1">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

       ¡
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
*/