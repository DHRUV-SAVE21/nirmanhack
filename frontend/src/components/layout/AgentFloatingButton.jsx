import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles, Send, Loader2 } from 'lucide-react';

const AgentFloatingButton = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'agent', content: 'Hello! I am your AI Agent. How can I help you today?' }
    ]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleSend = () => {
        if (!message.trim() || isThinking) return;

        const newHistory = [...chatHistory, { role: 'user', content: message }];
        setChatHistory(newHistory);
        setMessage('');
        setIsThinking(true);

        // Simulate agent thinking
        setTimeout(() => {
            setChatHistory([
                ...newHistory,
                { role: 'agent', content: 'I am currently a conceptual feature. Soon, I will be fully integrated to assist you with everything!' }
            ]);
            setIsThinking(false);
        }, 1500);
    };

    return (
        <div className="fixed bottom-[5.5rem] right-6 z-50 flex flex-col items-end gap-3">
            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-80 max-w-[calc(100vw-3rem)] overflow-hidden flex flex-col"
                        style={{ maxHeight: '400px' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <Bot size={20} />
                                <span className="font-semibold tracking-wide">AI Assistant</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 min-h-[200px] border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            {chatHistory.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                            msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-bl-sm shadow-sm'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isThinking && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Thinking...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white dark:bg-slate-900 flex items-center gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!message.trim() || isThinking}
                                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Agent Button */}
            <div className="relative">
                {/* Pulse Ring Effect when open */}
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.5, 1] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 bg-blue-500 rounded-full"
                            />
                        </>
                    )}
                </AnimatePresence>

                {/* Main Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggle}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-10 
                        ${isOpen
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/50 border-2 border-blue-300'
                            : 'bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-blue-400 border-2 border-slate-700 dark:border-slate-600 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/50'
                        }`}
                >
                    {isOpen ? (
                        <X size={24} />
                    ) : (
                        <Bot size={24} />
                    )}
                </motion.button>

                {/* Tooltip */}
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-slate-100 dark:border-slate-700"
                    >
                        AI Agent
                        <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white dark:bg-slate-800 border-t border-r border-slate-100 dark:border-slate-700 rotate-45 transform origin-center" />
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AgentFloatingButton;
