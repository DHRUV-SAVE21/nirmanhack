import React, { useState, useRef, useEffect } from 'react';
import { 
    MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw, 
    ChevronDown, ShieldCheck, Cpu, Volume2, Maximize2, Minimize2 
} from 'lucide-react';
import apiClient from '../../config/api';

const QUICK_PROMPTS = [
    { text: "PM-KUSUM 60% सोलर पंप की जानकारी", lang: "hi" },
    { text: "माझ्या बटाटा पिकावर अगेती झुलसा पडला आहे, काय करू?", lang: "mr" },
    { text: "What fertilizer to use if Nitrogen is 120 mg/kg?", lang: "en" },
    { text: "गेहूं की फसल की सिंचाई कब करनी चाहिए?", lang: "hi" }
];

export default function NugenChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 'welcome-1',
            role: 'assistant',
            content: 'नमस्ते! मी **अन्नदाता साथी** (Annadata Saathi) आहे. तुमच्या शेती, पिके, खते, माती आणि सरकारी योजनांबद्दल प्रश्न विचारा! (Ask me anything about farming in Hindi, Marathi, or English).',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            inputRef.current?.focus();
        }
    }, [messages, isOpen]);

    const handleSend = async (customText = null) => {
        const messageText = customText || input;
        if (!messageText || !messageText.strip ? !messageText.trim() : messageText.trim() === '') return;

        const userMsg = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!customText) setInput('');
        setLoading(true);
        setError(null);

        // Build conversation history for API (excluding welcome message)
        const historyPayload = messages
            .filter((m) => m.id !== 'welcome-1')
            .slice(-6) // Keep last 6 turns
            .map((m) => ({
                role: m.role,
                content: m.content
            }));

        try {
            const res = await apiClient.post('/api/nugen/chat', {
                message: userMsg.content,
                conversation_history: historyPayload,
                temperature: 0.7
            });

            if (res.data && res.data.response) {
                const aiMsg = {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content: res.data.response,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages((prev) => [...prev, aiMsg]);
            } else {
                throw new Error(res.data?.error || 'Empty response received.');
            }
        } catch (err) {
            console.error('AI Chatbot Error:', err);
            const errorMsg = err.response?.data?.detail || err.message || 'Unable to connect to AI Assistant. Please try again.';
            setError(errorMsg);
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    content: `[WARN] **Service Notice**: ${errorMsg}`,
                    isError: true,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClear = () => {
        setMessages([
            {
                id: 'welcome-1',
                role: 'assistant',
                content: 'नमस्ते! मी **अन्नदाता साथी** (Annadata Saathi) आहे. तुमच्या शेती, पिके, खते, माती आणि सरकारी योजनांबद्दल प्रश्न विचारा!',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        setError(null);
    };

    return (
        <>
            {/* Floating Trigger Button */}
            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
                    {/* Tooltip Badge */}
                    <div className="hidden md:flex items-center gap-2 bg-slate-900/90 text-white text-xs font-semibold px-3 py-2 rounded-xl backdrop-blur-md border border-emerald-500/30 shadow-xl animate-bounce">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AI Chatbot</span>
                    </div>

                    <button
                        onClick={() => setIsOpen(true)}
                        className="group relative p-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 flex items-center justify-center border border-emerald-400/30"
                        aria-label="Open AI Chatbot"
                    >
                        <Bot className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" />
                        {/* Live Online Badge */}
                        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse"></span>
                    </button>
                </div>
            )}

            {/* Chat Window Modal */}
            {isOpen && (
                <div
                    className={`fixed z-50 transition-all duration-300 ease-out flex flex-col ${
                        isExpanded
                            ? 'inset-4 md:inset-10 w-auto h-auto'
                            : 'bottom-4 right-4 md:bottom-6 md:right-6 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh]'
                    } bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden`}
                >
                    {/* Top Bar Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-emerald-500/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-white text-base">अन्नदाता साथी AI</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md">
                                        Farming AI
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                    <span>Online • Farming Intelligence</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-slate-400">
                            <button
                                onClick={handleClear}
                                title="Reset Chat"
                                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                title={isExpanded ? "Collapse" : "Expand"}
                                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
                            >
                                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                title="Close"
                                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none shadow-md'
                                            : msg.isError
                                            ? 'bg-rose-950/80 border border-rose-500/40 text-rose-200 rounded-bl-none'
                                            : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none shadow-sm'
                                    }`}
                                >
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                    <div className="mt-1 flex items-center justify-between text-[10px] opacity-60 gap-2">
                                        <span>{msg.timestamp}</span>
                                    </div>
                                </div>

                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Bot className="w-4 h-4 animate-spin" />
                                </div>
                                <div className="bg-slate-800/90 border border-slate-700/60 text-slate-300 px-4 py-3 rounded-2xl rounded-bl-none text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    <span className="text-xs text-slate-400 ml-1">AI Assistant processing...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestion Pills */}
                    {messages.length <= 3 && !loading && (
                        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {QUICK_PROMPTS.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(prompt.text)}
                                    className="shrink-0 text-xs bg-slate-800/90 hover:bg-emerald-950/80 hover:text-emerald-300 text-slate-300 border border-slate-700/70 hover:border-emerald-500/40 px-3 py-1.5 rounded-full transition-all duration-200"
                                >
                                    {prompt.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Footer Area */}
                    <div className="p-3 border-t border-emerald-500/20 bg-slate-950/90 flex items-center gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask in Hindi, Marathi, or English..."
                            rows={1}
                            disabled={loading}
                            className="flex-1 bg-slate-900 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl border border-slate-700/80 focus:border-emerald-500 focus:outline-none resize-none min-h-[42px] max-h-[100px]"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                            className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:hover:from-emerald-600 text-white rounded-xl shadow-md transition-all duration-200 flex items-center justify-center shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
