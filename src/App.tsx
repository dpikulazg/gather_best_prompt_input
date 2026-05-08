import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image as ImageIcon, 
  Trash2, 
  Settings2, 
  Sparkles, 
  Cpu, 
  Terminal,
  X
} from 'lucide-react';
import { Message, Role, ModelId, MessagePart } from './types';
import { sendMessageStream } from './services/geminiService';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelId, setModelId] = useState<ModelId>(ModelId.FLASH);
  const [attachments, setAttachments] = useState<{file: File, preview: string}[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (prev) => {
        const result = prev.target?.result;
        if (typeof result === 'string') {
          setAttachments(old => [...old, { file, preview: result }]);
        }
      };
      reader.readAsDataURL(file as any);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(old => old.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;

    const currentInput = input;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);

    const userParts: MessagePart[] = [];
    if (currentInput.trim()) userParts.push({ text: currentInput });
    
    for (const att of currentAttachments) {
      const base64Data = att.preview.split(',')[1];
      userParts.push({
        inlineData: {
          mimeType: att.file.type,
          data: base64Data
        }
      });
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      parts: userParts,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      const botMsgId = (Date.now() + 1).toString();
      let botText = '';
      
      const stream = sendMessageStream(newMessages, modelId);
      
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: Role.BOT,
        parts: [{ text: '' }],
        timestamp: Date.now()
      }]);

      for await (const chunk of stream) {
        botText += chunk;
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, parts: [{ text: botText }] } : m
        ));
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.BOT,
        parts: [{ text: 'Error: Failed to get response.' }],
        timestamp: Date.now()
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-600/30 overflow-hidden relative">
      {/* Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-72 border-r border-white/10 bg-slate-950/40 backdrop-blur-2xl flex flex-col z-20"
          >
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Cpu size={16} className="text-white" />
              </div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-slate-200">Gemini Protocol</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <section>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Terminal size={12} /> CONFIGURATION
                </label>
                <div className="space-y-3">
                  <button
                    onClick={() => setModelId(ModelId.FLASH)}
                    className={`w-full p-4 rounded-xl text-left text-sm transition-all duration-300 border backdrop-blur-md ${
                      modelId === ModelId.FLASH 
                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-100 shadow-lg shadow-blue-900/10' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-2">
                      <Sparkles size={14} className={modelId === ModelId.FLASH ? "text-blue-400" : ""} /> Flash 3.0
                    </div>
                    <div className="text-[11px] opacity-60 mt-1">High-speed processing</div>
                  </button>
                  <button
                    onClick={() => setModelId(ModelId.PRO)}
                    className={`w-full p-4 rounded-xl text-left text-sm transition-all duration-300 border backdrop-blur-md ${
                      modelId === ModelId.PRO 
                        ? 'bg-purple-600/10 border-purple-500/50 text-purple-100 shadow-lg shadow-purple-900/10' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-2">
                      <Cpu size={14} className={modelId === ModelId.PRO ? "text-purple-400" : ""} /> Pro 3.1
                    </div>
                    <div className="text-[11px] opacity-60 mt-1">Complex reasoning</div>
                  </button>
                </div>
              </section>

              <section>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">STATUS FEED</label>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Latency</span>
                    <span className="text-green-400 font-mono">142ms</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Uplink</span>
                    <span className="text-blue-400 font-mono">STABLE</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-4 border-t border-white/10">
              <button 
                onClick={() => setMessages([])}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all text-xs font-medium"
              >
                <Trash2 size={14} /> Clear Session
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 backdrop-blur-md bg-slate-950/40 sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <Settings2 size={18} />
            </button>
            <div className="h-4 w-px bg-white/10" />
            <nav className="flex items-center space-x-2 text-[11px] font-mono tracking-wider">
              <span className="text-slate-500">PROJECTS</span>
              <span className="text-slate-700">/</span>
              <span className="text-slate-500 uppercase">Agent Multimodal</span>
              <span className="text-slate-700">/</span>
              <span className="text-white">PLAYGROUND</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full text-[10px] flex items-center space-x-2 text-slate-300">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="font-mono uppercase">System Ready</span>
            </div>
            <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-blue-900/40 border border-blue-400/20">
              Uplink Active
            </button>
          </div>
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 scroll-smooth relative"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-10">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative group">
                <Sparkles className="text-blue-400 w-16 h-16 transition-transform group-hover:scale-110 duration-500" />
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 animate-pulse" />
              </div>
              <div>
                <h2 className="text-4xl font-light tracking-tight mb-4 text-white">Agent Studio</h2>
                <p className="text-slate-400 leading-relaxed font-sans text-lg">
                  Initialize a multimodal session to begin architecting with Gemini's reasoning engine.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4">
                {[
                  "Explain neural networks",
                  "Draft technical spec",
                  "Analyze system diagram",
                  "Microservices strategy"
                ].map((hint, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(hint)}
                    className="p-5 rounded-2xl border border-white/5 bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 backdrop-blur-md text-sm text-center transition-all text-slate-400 hover:text-white"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10 pb-32">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] space-y-2 ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-bold">
                        {msg.role === Role.USER ? 'Operator' : 'Gemini_Core'}
                      </span>
                    </div>
                    
                    <div className={`p-5 rounded-2xl backdrop-blur-xl border ${
                      msg.role === Role.USER 
                        ? 'bg-blue-600/90 border-blue-400/30 text-white shadow-xl shadow-blue-900/20' 
                        : 'bg-white/5 border-white/10 text-slate-200 shadow-xl'
                    }`}>
                      {msg.parts.map((part, i) => (
                        <div key={i} className="space-y-4">
                          {part.text && (
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-sans">
                              {part.text}
                            </p>
                          )}
                          {part.inlineData && (
                            <div className="relative group">
                              <img 
                                src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                                alt="attachment"
                                className="max-w-md rounded-xl border border-white/10 shadow-lg"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area + Footer Section */}
        <div className="mt-auto relative z-20">
          <div className="px-4 md:px-10 pb-4">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Chat Input */}
              <div className="md:col-span-3">
                <div className="bg-slate-900/60 border border-white/10 backdrop-blur-3xl rounded-[28px] p-2 shadow-2xl">
                  {attachments.length > 0 && (
                    <div className="flex gap-2 p-3 overflow-x-auto pb-4 scrollbar-none">
                      {attachments.map((att, i) => (
                        <div key={i} className="relative group shrink-0">
                          <img src={att.preview} className="w-16 h-16 object-cover rounded-xl border border-white/10 shadow-lg" />
                          <button 
                            onClick={() => removeAttachment(i)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-slate-500 hover:text-white transition-colors"
                    >
                      <ImageIcon size={18} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept="image/*" />
                    <textarea 
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-sm text-slate-100 placeholder:text-slate-600"
                    />
                    <button 
                      type="submit"
                      disabled={(!input.trim() && attachments.length === 0) || isStreaming}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white p-3 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="hidden md:block">
                <div className="bg-white/5 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inference</span>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl font-light text-white tracking-tighter">
                      142<span className="text-[10px] text-slate-500 ml-1 uppercase">ms</span>
                    </div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-widest">Latency</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Global Footer */}
          <footer className="h-8 bg-blue-600/90 backdrop-blur-md px-6 flex items-center justify-between text-[10px] font-bold text-blue-100 uppercase tracking-widest relative z-30">
            <div className="flex items-center space-x-6">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-200 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                Session: Active-RT-44X
              </span>
              <span>Region: Global-West</span>
            </div>
            <div className="flex space-x-6 opacity-80 font-mono">
              <span>Security: AES-256</span>
              <span>Google Cloud Platform</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
