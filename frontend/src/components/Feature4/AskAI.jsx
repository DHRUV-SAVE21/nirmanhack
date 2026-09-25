import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';

const AskAI = ({ profile: initialProfile, onApplicationSubmit }) => {
    const [profile, setProfile] = useState(initialProfile || null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load profile from API on mount if not provided
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await fetch(`${API_URL}/api/feature4/profile?user_id=default`);
                const data = await response.json();
                if (data.profile) {
                    setProfile(data.profile);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        };

        if (!initialProfile) {
            loadProfile();
        }
    }, []);

    // Update profile when prop changes
    useEffect(() => {
        if (initialProfile) {
            setProfile(initialProfile);
        }
    }, [initialProfile]);

    // Set initial greeting message
    useEffect(() => {
        const greeting = `Namaste! I am your AI Scheme Advisor. ${profile?.name ? `Welcome, ${profile.name}! ` : ''}Tell me about your farming needs, and I'll recommend the best government schemes for you.`;
        if (messages.length === 0) {
            setMessages([{ role: 'agent', content: greeting }]);
        }
    }, [profile]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Fetch the latest profile from API to ensure we have up-to-date data
            let currentProfile = profile;
            try {
                const profileResponse = await fetch(`${API_URL}/api/feature4/profile?user_id=default`);
                const profileData = await profileResponse.json();
                if (profileData.profile) {
                    currentProfile = profileData.profile;
                    setProfile(currentProfile);
                }
            } catch (e) {
                console.log('Using cached profile');
            }

            // Convert messages to format backend expects
            const history = updatedMessages.map(m => ({
                role: m.role === 'agent' ? 'assistant' : 'user',
                content: m.content
            }));

            const response = await fetch(`${API_URL}/api/feature4/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    history: history,
                    thread_id: 'demo-thread',
                    user_state: currentProfile || {}
                })
            });

            // Check for API errors (like 429 Quota Exceeded)
            if (!response.ok) {
                throw new Error(`https error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.response) {
                setMessages(prev => [...prev, {
                    role: 'agent',
                    content: data.response,
                    schemes: data.found_schemes,
                    applicationStatus: data.application_status
                }]);

                // If application was submitted, notify parent component to add to My Applications
                if (data.application_status === 'submitted' && data.application_details && onApplicationSubmit) {
                    onApplicationSubmit(data.application_details);
                }
            } else {
                throw new Error("Invalid API response format");
            }


        } catch (error) {
            console.warn("Backend unavailable or quota exhausted, using mock AI response.");

            // Simulating AI delay
            setTimeout(() => {
                let textResponse = "I am currently running in offline mode. ";
                const lowerInput = userMsg.content.toLowerCase();
                let mockApplication = null;

                if (lowerInput.includes("apply")) {
                    textResponse = "Great! I have submitted your application for the scheme. You can track its status in the 'My Applications' tab. Reference No: APP-DEMO-2026. Is there anything else I can help you with?";
                    mockApplication = {
                        scheme_name: "PM-KISAN (Demo)",
                        applicant_name: profile?.name || "Farmer",
                        state: profile?.state || "Maharashtra",
                        status: "Submitted",
                        reference_no: "APP-DEMO-" + Math.floor(Math.random() * 1000)
                    };
                } else if (lowerInput.includes("tractor")) {
                    textResponse += "For tractors, you can avail subsidies under the Sub-Mission on Agricultural Mechanization (SMAM). Subsidy ranges from 25% to 50% depending on your category.";
                } else if (lowerInput.includes("irrigation") || lowerInput.includes("water") || lowerInput.includes("pump")) {
                    textResponse += "For irrigation, the PM Krishi Sinchai Yojana offers up to 55% subsidy for small and marginal farmers for drip and sprinkler systems.";
                } else if (lowerInput.includes("insurance") || lowerInput.includes("loss")) {
                    textResponse += "The PM Fasal Bima Yojana (PMFBY) covers crop losses due to natural calamities. Premium is 2% for Kharif and 1.5% for Rabi crops.";
                } else {
                    textResponse += "Generally, for most government schemes, you will need your Aadhar Card, Bank Passbook, and Land Documents (7/12). Please visit your nearest Agriculture Department office or Common Service Centre (CSC) for specific details.";
                }

                setMessages(prev => {
                    return [...prev, {
                        role: 'agent',
                        content: textResponse
                    }];
                });

                if (mockApplication && onApplicationSubmit) {
                    onApplicationSubmit(mockApplication);
                }

            }, 1500);

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

    const suggestedQuestions = [
        "What subsidies are available for tractors?",
        "I want to install solar pumps on my farm",
        "Any schemes for SC/ST farmers in Maharashtra?",
        "How to get subsidy for cold storage?"
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                            <div className="whitespace-pre-wrap">{msg.content.replace(/\*\*/g, '')}</div>
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
                            <span className="text-slate-600 dark:text-gray-400 text-sm">Analyzing schemes...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions (show only at start) */}
            {messages.length === 1 && (
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400 mb-2">
                        <Sparkles size={14} className="text-organic-green" />
                        Try asking:
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => setInput(q)}
                                className="text-xs px-3 py-1.5 bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-full text-slate-700 dark:text-gray-300 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-black/20 border-t border-slate-200 dark:border-white/10">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask about subsidies, schemes, insurance..."
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
    );
};

export default AskAI;
