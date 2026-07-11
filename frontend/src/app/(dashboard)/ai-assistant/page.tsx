'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon, PaperAirplaneIcon, LightBulbIcon, MapPinIcon,
  ExclamationTriangleIcon, ChartBarIcon, ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon, BellIcon,
} from '@heroicons/react/24/outline';
import AppShell from '@/components/layout/AppShell';
import { pageThemes } from '@/lib/theme/page-themes';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'alert';
}

const suggestions = [
  { icon: MagnifyingGlassIcon, text: 'Show me issues near my location', color: 'from-blue-500 to-indigo-600' },
  { icon: ExclamationTriangleIcon, text: 'What are the top priority issues today?', color: 'from-red-500 to-rose-600' },
  { icon: ChartBarIcon, text: 'Generate department performance report', color: 'from-emerald-500 to-green-600' },
  { icon: BellIcon, text: 'Any emergency alerts in my area?', color: 'from-amber-500 to-orange-600' },
];

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your AI Civic Intelligence Assistant. I can help you:\n\n🔍 Search and track nearby issues\n📊 Analyze community trends\n🚨 Check emergency alerts\n📋 Report new problems\n🗺️ Navigate the platform\n\nHow can I assist you today?",
    timestamp: new Date(),
    type: 'text',
  },
];

export default function AIAssistantPage() {
  const theme = pageThemes.ai_assistant;
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 1500));

    let response = '';
    const lower = content.toLowerCase();
    if (lower.includes('nearby') || lower.includes('near me') || lower.includes('location')) {
      response = "📍 **Nearby Issues (2km radius)**\n\nI found 5 issues near your current location:\n\n1. 🛤️ Broken streetlight - 0.3km away - High Priority\n2. 💧 Water leakage - 0.8km away - Critical\n3. 🗑️ Garbage accumulation - 1.2km away - Medium\n4. ⚡ Fallen electric wire - 1.5km away - Critical\n5. 🌊 Blocked drain - 1.8km away - Medium\n\nWould you like me to help you report a new issue or view details of any of these?";
    } else if (lower.includes('priority') || lower.includes('top') || lower.includes('important')) {
      response = "📊 **Top Priority Issues Today**\n\nBased on AI severity analysis and community impact scoring:\n\n🔴 **Critical (3)**\n- Gas leak detected on Industrial Area Road\n- Building wall crack in Ward 12\n- Flooding risk near River Bridge\n\n🟠 **High (7)**\n- Multiple potholes on Highway 45\n- Street light outage in Sector 14\n- Water main break on Park Street\n\nThe AI recommends immediate dispatch for the 3 critical issues. Would you like me to escalate these?";
    } else if (lower.includes('emergency') || lower.includes('alert')) {
      response = "🚨 **Active Emergency Alerts**\n\nThere are 2 active emergency alerts in your area:\n\n⚠️ **Flood Warning** - Ward 14 & 15\nSeverity: HIGH | Updated 30 min ago\nEvacuation recommended for low-lying areas\n\n⚠️ **Gas Leak Alert** - Industrial Area\nSeverity: CRITICAL | Updated 1 hour ago\nArea has been cordoned. Avoid the area.\n\nI can share live evacuation routes and emergency contacts if needed.";
    } else if (lower.includes('report')) {
      response = "📝 **Smart Issue Reporting**\n\nI can help you create an AI-assisted report. Just tell me:\n\n1. What's the issue? (describe it briefly)\n2. Where is it? (address or landmark)\n3. How urgent is it?\n\nOr you can go to the **Report Issue** page for the full form with image/video upload.\n\n💡 Tip: Describing the issue here lets me auto-fill the form and pre-analyze it for you!";
    } else {
      response = `I understand you're asking about "${content}". Let me analyze this for you.\n\nBased on my intelligence analysis:\n\n• I've searched across all active issues in the database\n• Cross-referenced with community reports\n• Applied AI classification and impact scoring\n\nCould you be more specific? I can help with:\n- 📍 Finding issues by location\n- 📊 Community analytics\n- 🚨 Emergency information\n- 📝 Issue reporting\n- 🎯 Department recommendations`;
    }

    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date(), type: 'text' };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <AppShell>
      <div className={`${theme.background} min-h-full flex flex-col h-[calc(100vh-4rem)]`}>
        {/* Header */}
        <div className="p-4 md:p-6 pb-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <div className={`${theme.gradient} rounded-xl p-2.5 text-white`}>
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-white">AI Assistant</h1>
              <p className="text-xs text-slate-500">Powered by Civic Intelligence Engine</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>
          </motion.div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-6 py-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    : 'glass-card-strong'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <SparklesIcon className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">AI Assistant</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content.split('\n').map((line, i) => {
                    if (line.startsWith('📍') || line.startsWith('📊') || line.startsWith('🚨') || line.startsWith('📝')) {
                      return <p key={i} className="font-bold mt-2 mb-1">{line}</p>;
                    }
                    return <p key={i}>{line}</p>;
                  })}</div>
                  <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="glass-card px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-[10px] font-semibold text-purple-600">AI is thinking</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 md:px-6 pb-2">
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((s, i) => (
                <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                  onClick={() => handleSend(s.text)}
                  className="glass-card p-3 text-left hover:shadow-lg transition-all group">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.text}</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 md:px-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about civic issues..."
              className="input-field flex-1 !py-3"
              disabled={isTyping}
            />
            <button type="submit" disabled={!input.trim() || isTyping}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 flex-shrink-0">
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
