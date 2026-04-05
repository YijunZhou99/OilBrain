import React, { useState, useEffect, useRef } from 'react';
import { Send, Database, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import type { Message, ChatHistoryMessage, Citation, WebCitation } from '../types';
import { sendChat, getSettings } from '../services/api';

const WELCOME_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: 'Hello! I am OilBrain. I can help you analyze oil market reports from your knowledge base. What would you like to know today?',
  timestamp: new Date(),
};

function CitationCard({ citation }: { citation: Citation }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs">
      <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
        <Database size={10} className="flex-shrink-0" />
        <span>{citation.doc_name}</span>
        {citation.page != null && <span className="text-gray-400 font-normal">p. {citation.page}</span>}
      </div>
      {citation.snippet && (
        <blockquote className="text-gray-400 italic border-l-2 border-gray-200 pl-2 mt-1 leading-relaxed">
          {citation.snippet}
        </blockquote>
      )}
    </div>
  );
}

function CollapsibleSources({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-brand-primary transition-colors flex items-center gap-1"
      >
        <span>{open ? '▾' : '▸'}</span> Sources ({citations.length})
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {citations.map((c, i) => (
            <CitationCard key={i} citation={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function WebCitationCard({ citation }: { citation: WebCitation }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
      <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
        <Globe size={10} className="flex-shrink-0" />
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline truncate"
        >
          {citation.title}
        </a>
      </div>
      {citation.snippet && (
        <blockquote className="text-gray-400 italic border-l-2 border-blue-200 pl-2 mt-1 leading-relaxed">
          {citation.snippet}
        </blockquote>
      )}
    </div>
  );
}

function CollapsibleWebSources({ citations }: { citations: WebCitation[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1"
      >
        <span>{open ? '▾' : '▸'}</span> Web Sources ({citations.length})
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {citations.map((c, i) => (
            <WebCitationCard key={i} citation={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
      <div className="space-y-2 flex-1 max-w-[80%]">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [llmModel, setLlmModel] = useState<string | undefined>(undefined);
  const [citationsEnabled, setCitationsEnabled] = useState<boolean | undefined>(undefined);
  const [apiKey, setApiKey] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setLlmModel(s.llm_model);
        setCitationsEnabled(s.citations_enabled);
        setApiKey(s.api_key);
      })
      .catch(() => {
        // fall through with undefined — sendChat will use server defaults
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const history: ChatHistoryMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChat({
        message: input,
        history,
        llm_model: llmModel,
        citations_enabled: citationsEnabled,
        api_key: apiKey,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        citations: response.citations.length > 0 ? response.citations : undefined,
        web_citations: response.web_citations.length > 0 ? response.web_citations : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't reach the server. Please check your API key in Settings.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col"
    >
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-brand-accent flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                  OB
                </div>
              )}
              <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-primary text-white rounded-tr-none'
                      : 'bg-white border border-gray-100 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.citations && msg.citations.length > 0 && (
                  <CollapsibleSources citations={msg.citations} />
                )}
                {msg.web_citations && msg.web_citations.length > 0 && (
                  <CollapsibleWebSources citations={msg.web_citations} />
                )}

                <div className={`text-[10px] text-gray-400 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-bold">
                  U
                </div>
              )}
            </div>
          ))}
          {isLoading && <LoadingSkeleton />}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="p-8 pt-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSendMessage}
            className="relative bg-white border border-gray-200 rounded-2xl shadow-lg p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-brand-accent/20 transition-all"
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask about WTI inventory, OPEC production, or EIA forecasts..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none max-h-32"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-brand-primary text-white rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-[10px] text-center text-gray-400 mt-3">
            OilBrain can make mistakes. Verify important data with original reports.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
