// src/App.tsx

import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message, Chat, FileAttachment } from './types';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ChatTray } from './components/ChatTray';
import HighchartsChart from './components/HighchartsChart';

const createInitialChat = (): Chat => ({
  id: uuidv4(),
  title: 'New Conversation',
  messages: [
    {
      id: 1,
      text: "¡Hola! Soy tu asistente de IA. Puedes enviarme mensajes, adjuntar archivos o pedirme que cree gráficos utilizando canvas.",
      isBot: true,
      timestamp: new Date(),
    },
  ],
  lastUpdated: new Date(),
});

function App() {
  const [chats, setChats] = useState<Chat[]>([createInitialChat()]);
  const [activeChat, setActiveChat] = useState<string>(chats[0].id);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const getCurrentChat = () => {
    return chats.find((chat) => chat.id === activeChat) || chats[0];
  };

  const updateChat = (chatId: string, updatedChat: Chat) => {
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? updatedChat : chat))
    );
  };

  const handleNewChat = () => {
    const newChat = createInitialChat();
    setChats((prev) => [...prev, newChat]);
    setActiveChat(newChat.id);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => {
      const updatedChats = prev.filter((chat) => chat.id !== chatId);
      if (updatedChats.length === 0) {
        const newChat = createInitialChat();
        return [newChat];
      }
      return updatedChats;
    });

    setActiveChat((prevActiveChat) => {
      if (prevActiveChat === chatId) {
        const remainingChats = chats.filter((chat) => chat.id !== chatId);
        return remainingChats.length > 0
          ? remainingChats[0].id
          : createInitialChat().id;
      }
      return prevActiveChat;
    });
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent, file?: FileAttachment): Promise<void> => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    const currentChat = getCurrentChat();
    const messageId = currentChat.messages.length + 1;
    const timestamp = new Date();

    const userMessage: Message = {
      id: messageId,
      text: input || (file ? `Archivo adjunto: ${file.name}` : ''),
      isBot: false,
      timestamp,
      attachment: file,
    };

    let updatedChat: Chat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage],
      lastUpdated: timestamp,
      title:
        currentChat.messages.length === 1 ? input || file?.name || 'Chat' : currentChat.title,
    };

    updateChat(activeChat, updatedChat);
    setInput('');

    if (file) {
      setIsTyping(true); // Mostrar indicador de escritura

      try {
        // Crear FormData para enviar el archivo y el prompt
        const formData = new FormData();
        formData.append('prompt', input);
        // Asumiendo que necesitas enviar el contenido parseado como JSON
        formData.append(
          'file',
          new Blob([JSON.stringify(file.content)], { type: 'application/json' }),
          file.name
        );

        // Realizar la llamada a la API
        const apiUrl = 'https://your-backend-api-url/chart-data'; // Reemplaza con tu URL real

        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`La solicitud a la API falló con el estado ${response.status}`);
        }

        const data = await response.json();

        const { visualization_code, visualization_explanation } = data;

        if (!visualization_code) {
          throw new Error('La respuesta de la API no contiene visualization_code');
        }

        // Parsear visualization_code a opciones de Highcharts
        let options: Highcharts.Options;
        try {
          options = JSON.parse(visualization_code);
        } catch (err) {
          throw new Error('Error al parsear visualization_code: ' + err);
        }

        // Crear el mensaje del bot con el gráfico
        const botMessage: Message = {
          id: messageId + 1,
          text: visualization_explanation || 'Aquí está tu gráfico.',
          isBot: true,
          timestamp: new Date(),
          showChart: true,
          chartOptions: options,
        };

        // Actualizar el chat con el mensaje del bot
        updatedChat = {
          ...updatedChat,
          messages: [...updatedChat.messages, botMessage],
          lastUpdated: new Date(),
        };

        updateChat(activeChat, updatedChat);
      } catch (err: any) {
        console.error('Error al obtener los datos del gráfico:', err);
        const botMessage: Message = {
          id: messageId + 1,
          text: 'Lo siento, ocurrió un error al generar el gráfico: ' + err.message,
          isBot: true,
          timestamp: new Date(),
        };

        updatedChat = {
          ...updatedChat,
          messages: [...updatedChat.messages, botMessage],
          lastUpdated: new Date(),
        };

        updateChat(activeChat, updatedChat);
      } finally {
        setIsTyping(false); // Ocultar indicador de escritura
      }
    } else {
      // Si no hay archivo adjunto, manejar como mensaje normal o proporcionar feedback
      const botMessage: Message = {
        id: messageId + 1,
        text: 'Por favor, adjunta un archivo Excel o CSV para generar un gráfico.',
        isBot: true,
        timestamp: new Date(),
      };

      updatedChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, botMessage],
        lastUpdated: new Date(),
      };

      updateChat(activeChat, updatedChat);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <ChatTray
        chats={chats}
        activeChat={activeChat}
        onChatSelect={setActiveChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
      />
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="max-w-4xl mx-auto">
            {getCurrentChat().messages.map((message) => (
              <div key={message.id}>
                <ChatMessage message={message} />
                {message.showChart && message.chartOptions && (
                  <div className="my-4">
                    <HighchartsChart options={message.chartOptions} />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <ChatInput input={input} setInput={setInput} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

export default App;
