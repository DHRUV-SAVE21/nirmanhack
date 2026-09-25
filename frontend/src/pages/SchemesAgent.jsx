import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, FileText } from 'lucide-react';
import { getApiUrl } from '../config/api';

const SchemesAgent = () => {
    const [messages, setMessages] = useState([
        {
            role: 'agent',
            content: 'Namaste! I am your Agriculture Scheme Assistant. Tell me about your land and crops, and I can help you find relevant subsidies and policies.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Fetch local database profile to inject into AI context
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            let farmerProfile = {};
            try {
                const fp = localStorage.getItem('farmerProfile');
                if (fp) farmerProfile = JSON.parse(fp);
            } catch(e) { console.warn("Could not parse profile", e); }
            
            const userState = { ...user, ...farmerProfile };

            const response = await fetch(getApiUrl('api/feature4/chat'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    thread_id: user.id || 'demo-thread',
                    user_state: userState // Send full database profile to AI!
                })
            });

            const data = await response.json();

            if (data && data.response) {
                setMessages(prev => [...prev, { role: 'agent', content: data.response }]);

                // Handle application status
                if (data.application_status && data.application_status !== 'None') {
                    // Optional: Show a toast or special UI element
                }
            } else {
                setMessages(prev => [...prev, { role: 'agent', content: "I apologize, I'm having trouble connecting right now." }]);
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'agent', content: "Connection error. Please check if the backend is running." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 pb-20 max-w-4xl mx-auto">
            <div className="bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden h-[80vh] flex flex-col">

                {/* Header */}
                <div className="p-4 bg-organic-green/20 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-organic-green flex items-center justify-center">
                        <Bot className="text-slate-900 dark:text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kisan Sahayak</h2>
                        <p className="text-sm text-slate-700 dark:text-gray-300">Schemes & Subsidy Expert</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500' : 'bg-organic-green'
                                }`}>
                                {msg.role === 'user' ? <User size={16} className="text-slate-900 dark:text-white" /> : <Bot size={16} className="text-slate-900 dark:text-white" />}
                            </div>

                            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                                ? 'bg-blue-500/20 text-white rounded-tr-none'
                                : 'bg-white/10 text-gray-100 rounded-tl-none'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-organic-green flex items-center justify-center shrink-0">
                                <Bot size={16} className="text-slate-900 dark:text-white" />
                            </div>
                            <div className="bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                <Loader2 className="animate-spin text-organic-green" size={20} />
                                <span className="text-slate-600 dark:text-gray-400 text-sm">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/20 border-t border-slate-200 dark:border-white/10">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask about subsidies for tractors, crops, etc..."
                            className="flex-1 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-organic-green focus:bg-white/10 transition-all"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="px-4 py-2 bg-organic-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors flex items-center justify-center"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SchemesAgent;
