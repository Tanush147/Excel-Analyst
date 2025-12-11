import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, PlayCircle, Sheet as SheetIcon } from 'lucide-react';
import { Message, SheetSchema } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  fileName: string;
  schema: SheetSchema[];
  onReset: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isProcessing, 
  fileName,
  schema,
  onReset
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm flex-none">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <SheetIcon className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">{fileName}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {schema.length} Sheets Analysis Ready
            </p>
          </div>
        </div>
        <button 
          onClick={onReset}
          className="text-sm text-slate-500 hover:text-red-600 px-3 py-1 rounded-md hover:bg-slate-100 transition-colors"
        >
          Upload New File
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <Bot className="w-16 h-16 mb-4" />
            <p className="text-lg">Ask me anything about your data!</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
               <button onClick={() => onSendMessage("Summarize the data in the first sheet")} className="p-3 bg-white border border-slate-200 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition-colors text-left">
                 Summarize the data
               </button>
               <button onClick={() => onSendMessage("What are the column names?")} className="p-3 bg-white border border-slate-200 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition-colors text-left">
                 Show column names
               </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-none mt-1">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div 
              className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-none mt-1">
                <User className="w-5 h-5 text-slate-500" />
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-none">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-sm text-slate-500">Analyzing data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-slate-200 flex-none">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your Excel file..."
            disabled={isProcessing}
            className="w-full pl-6 pr-14 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm text-slate-700 placeholder:text-slate-400 disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-3 top-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            {isProcessing ? (
               <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
               <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <div className="text-center mt-2">
            <p className="text-xs text-slate-400">Powered by Tanush Dey</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;