import React, { useState } from 'react';
import { ExcelData, SheetSchema, Message } from './types';
import * as ExcelService from './services/excelService';
import * as GeminiService from './services/geminiService';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import { BarChart3 } from 'lucide-react';

function App() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [schema, setSchema] = useState<SheetSchema[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessingChat, setIsProcessingChat] = useState(false);

  const handleFileLoaded = async (file: File) => {
    setIsLoadingFile(true);
    try {
      setFileName(file.name);
      const data = await ExcelService.parseExcelFile(file);
      const fileSchema = ExcelService.getWorkbookSchema(data);
      
      setExcelData(data);
      setSchema(fileSchema);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `I've successfully loaded **${file.name}**. \n\nIt contains ${fileSchema.length} sheets: ${fileSchema.map(s => `**${s.sheetName}** (${s.rowCount} rows)`).join(', ')}. \n\nHow can I help you analyze this data today?`,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error(error);
      alert("Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!excelData || !schema) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessingChat(true);

    try {
      // Step 1: Generate Plan
      const plan = await GeminiService.generateExecutionPlan(text, schema);
      
      // Step 2: Execute Plan locally
      const result = ExcelService.executePlan(excelData, plan);

      // Step 3: Summarize Result
      const summary = await GeminiService.generateNaturalLanguageResponse(text, result);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: summary,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while analyzing the data. Please try rephrasing your question or checking if the data supports this query.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessingChat(false);
    }
  };

  const handleReset = () => {
    setExcelData(null);
    setSchema([]);
    setFileName('');
    setMessages([]);
  };

  if (!excelData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 hover:rotate-6 transition-transform">
              <BarChart3 className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Excel AI Analyst</h1>
            <p className="text-lg text-slate-500 max-w-md mx-auto">
              Upload your spreadsheet and let AI answer your questions instantly. Secure, client-side processing.
            </p>
          </div>
          <FileUpload onFileLoaded={handleFileLoaded} isLoading={isLoadingFile} />
        </div>
        <footer className="p-6 text-center text-slate-400 text-sm">
          Powered by Tanush Dey
        </footer>
      </div>
    );
  }

  return (
    <ChatInterface 
      messages={messages} 
      onSendMessage={handleSendMessage} 
      isProcessing={isProcessingChat}
      fileName={fileName}
      schema={schema}
      onReset={handleReset}
    />
  );
}

export default App;