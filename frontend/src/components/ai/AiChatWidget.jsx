import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { aiAPI } from '../../services/aiAPI';

const AiChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I am SILM's National Emergency AI. I can help predict fuel trends, verify alerts, or provide emergency guidance. How can I assist you?", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const res = await aiAPI.chatAssistant(userMessage.text, 'dashboard');
            const aiReply = { id: Date.now() + 1, text: res.data.reply, sender: 'ai' };
            setMessages(prev => [...prev, aiReply]);
        } catch (error) {
            console.error("AI Chat Error:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Connection error. Please try again later.", sender: 'ai', error: true }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-full shadow-lg shadow-cyan-500/20 transition-all duration-300 group flex items-center justify-center border border-cyan-300"
            >
                <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-2 -right-2 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] z-50 flex flex-col bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-cyan-500/20">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-100">National Emergency AI</h3>
                        <p className="text-xs text-cyan-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                            msg.sender === 'user' 
                                ? 'bg-cyan-600 text-white rounded-br-none' 
                                : msg.error 
                                    ? 'bg-red-500/20 border border-red-500/30 text-red-200 rounded-bl-none'
                                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-800/80 border-t border-slate-700">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className="w-full bg-slate-900 border border-slate-600 rounded-full py-2.5 pl-4 pr-12 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                        disabled={isTyping}
                    />
                    <button 
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-1 p-1.5 bg-cyan-500 text-slate-900 rounded-full hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 transition-colors"
                    >
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AiChatWidget;
