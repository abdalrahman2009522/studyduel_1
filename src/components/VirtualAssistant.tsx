import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Minus, Maximize2, Sparkles, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../lib/soundManager';

export function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: 'مرحباً! أنا مساعدك الذكي في Study Duel. كيف يمكنني مساعدتك اليوم في دراستك؟ ✨' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);
    soundManager.playClick();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const systemPrompt = `أنت مساعد تعليمي ذكي في تطبيق "Study Duel" (ستادي دويل). 
      اسم الطالب هو ${profile?.displayName}. 
      مهمتك هي مساعدته في فهم المواد الدراسية، تشجيعه، والإجابة على تساؤلاته حول التطبيق.
      اجعل إجاباتك ودودة، محفزة، وقصيرة نسبياً. استخدم اللغة العربية الفصحى البسيطة.`;

      const conversation = messages.map(m => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`).join('\n');
      const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${conversation}\nStudent: ${userMessage}\nAssistant:`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt,
      });

      const text = response.text || "عذراً، لم أتمكن من الرد. حاول لاحقاً.";

      setMessages(prev => [...prev, { role: 'bot', content: text }]);
      soundManager.playNotification();
    } catch (error) {
      console.error("AI Assistant Error:", error);
      const isQuotaExceeded = (error instanceof Error && error.message.includes('429')) || 
                             (typeof error === 'string' && error.includes('429')) ||
                             (error && typeof error === 'object' && JSON.stringify(error).includes('429'));
                             
      if (isQuotaExceeded) {
          setMessages(prev => [...prev, { role: 'bot', content: "ميزة الذكاء الاصطناعي تجاوزت الحد المسموح للاستخدام حالياً، يرجى المحاولة غداً!" }]);
      } else {
          setMessages(prev => [...prev, { role: 'bot', content: "عذراً، واجهت مشكلة في الاتصال. حاول مرة أخرى لاحقاً." }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[150] pointer-events-none">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto w-16 h-16 bg-[#747474] rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all relative group overflow-hidden border-2 border-white/20"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-10 h-10 object-contain relative z-10"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to Bot icon if image is missing
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.fallback-icon')) {
                  const icon = document.createElement('div');
                  icon.className = 'fallback-icon';
                  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>';
                  parent.appendChild(icon);
                }
              }}
            />
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '80px' : '600px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={`pointer-events-auto w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300`}
        >
          {/* Header */}
          <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white flex flex-row-reverse items-center justify-between shrink-0">
               <div className="flex flex-row-reverse items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                     <Sparkles size={20} className="text-white" />
                  </div>
                  <div className="text-right">
                     <h3 className="text-sm font-black arabic-text">المعلم الذكي</h3>
                     <p className="text-[10px] text-primary font-black uppercase tracking-widest">AI Sidekick</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                     {isMinimized ? <Maximize2 size={18} /> : <Minus size={18} />}
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                     <X size={18} />
                  </button>
               </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.role === 'user' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} flex-row-reverse gap-3`}
                    >
                       <div className={`
                          max-w-[80%] p-4 rounded-[24px] text-sm arabic-text font-bold leading-relaxed
                          ${m.role === 'user' 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'}
                       `}>
                          <Markdown>{m.content}</Markdown>
                       </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex flex-row-reverse gap-3">
                       <div className="bg-white p-4 rounded-[24px] rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                       </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                   <div className="flex flex-row-reverse items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-[28px] border border-slate-100 dark:border-slate-700 focus-within:border-primary/30 transition-all">
                      <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="اسألني أي شيء..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-right arabic-text font-bold px-4 h-12 text-slate-900 dark:text-white"
                      />
                      <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${input.trim() && !isTyping ? 'bg-primary text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}
                      >
                         <Send size={20} className={input.trim() ? '-rotate-45' : ''} />
                      </button>
                   </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
