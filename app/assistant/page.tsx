'use client';

import { useState, useEffect } from 'react';
import { queryAssistant, AssistantResponse } from '@/lib/assistant';
import { CitizenReport } from '@/lib/types';
import { getStoredReports } from '@/lib/reports';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  response?: AssistantResponse;
}

const EXAMPLE_QUESTION_CHIPS = [
  'Safe cheap veg food near Karla Caves',
  'Best places to visit during rain under 300',
  'Safest budget stay under 2000',
  'Compare Bhushi Dam vs Tungarli Lake',
];

export default function AssistantPage() {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const loaded = getStoredReports();
    setReports(loaded);

    // Initial greeting
    setMessages([
      {
        role: 'assistant',
        text: 'Hello! I am your offline Lonavala Safety & City Assistant. Ask me anything about budget dining, monsoon safety, places to visit during rain, or compare locations.',
      },
    ]);
  }, []);

  const handleAsk = (questionText: string) => {
    const q = questionText.trim();
    if (!q) return;

    const userMessage: ChatMessage = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = queryAssistant(q, reports);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        text: response.answerText,
        response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 250);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Lonavala AI City Assistant
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Query budget dining, monsoon-safe viewpoints, and live safety notices. (No external API keys, 100% offline intelligence).
        </p>
      </div>

      {/* 4 Example Question Chips */}
      <div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
          Suggested Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTION_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(chip)}
              className="text-xs sm:text-sm font-semibold bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-gray-700 px-3.5 py-2 rounded-xl transition border border-gray-200 shadow-2xs text-left"
            >
              💬 {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-6 overflow-y-auto max-h-[580px] space-y-5">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 text-xs sm:text-sm shadow-2xs ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-xs'
                  : 'bg-slate-100 text-slate-900 rounded-bl-xs'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed font-medium">{m.text}</p>

              {/* Suggestions List */}
              {m.response && m.response.suggestions.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-3">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                    Recommended Places:
                  </span>
                  <div className="grid grid-cols-1 gap-3">
                    {m.response.suggestions.map((s) => (
                      <div
                        key={s.place.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2 shadow-xs"
                      >
                        {/* Header: Name and Price */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-sm text-gray-900 block">
                              {s.place.name}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm">
                              {s.place.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {s.price}
                            </span>
                          </div>
                        </div>

                        {/* One-line Reason */}
                        <div className="text-slate-700 text-xs leading-snug">
                          <strong>Why recommend:</strong> {s.reason}
                        </div>

                        {/* Safety Note */}
                        {s.safetyNote && (
                          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                            <strong>Safety Note:</strong> {s.safetyNote}
                          </div>
                        )}

                        {/* Warning if recent reports in localStorage "cl_reports" are near (within 1 km) */}
                        {s.nearbyReportWarning && (
                          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-900 text-[11px] font-semibold flex items-start gap-1.5 animate-pulse">
                            <span>⚠️</span>
                            <span>{s.nearbyReportWarning}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>Assistant is filtering safe places...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question (e.g. 'Safe cheap veg food near Karla Caves')..."
          className="flex-1 px-4 py-3 text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-xs"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
