import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IcoSend = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>;

const ChatScreen = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef(null);

    const [inputText, setInputText] = useState('');

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['chatMessages', sessionId],
        queryFn: async () => {
            const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch messages');
            return res.json();
        },
        enabled: !!token && !!sessionId,
        refetchInterval: 2000
    });

    const sendMutation = useMutation({
        mutationFn: async (text) => {
            const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });
            if (!res.ok) throw new Error('Failed to send');
            return res.json();
        },
        onMutate: async (newText) => {
            await queryClient.cancelQueries(['chatMessages', sessionId]);
            const previousMessages = queryClient.getQueryData(['chatMessages', sessionId]);

            const optimisticMsg = {
                _id: Date.now().toString(),
                sessionId,
                senderId: user._id,
                text: newText,
                createdAt: new Date().toISOString()
            };

            queryClient.setQueryData(['chatMessages', sessionId], old => [...(old || []), optimisticMsg]);

            return { previousMessages };
        },
        onError: (err, newText, context) => {
            queryClient.setQueryData(['chatMessages', sessionId], context.previousMessages);
        },
        onSettled: () => {
            queryClient.invalidateQueries(['chatMessages', sessionId]);
            queryClient.invalidateQueries(['chatSessions']);
        }
    });

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        sendMutation.mutate(inputText.trim());
        setInputText('');
    };

    // Auto-scroll to bottom only when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        /* Structural Fix: 100dvh prevents Safari/Chrome mobile browser bar jumping */
        <div className="flex flex-col h-[100dvh] bg-slate-100 font-sans overflow-hidden">

            {/* ─── 1. FIXED HEADER ─── */}
            <header className="shrink-0 h-14 bg-white border-b border-slate-200 flex items-center px-4 z-50">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 active:bg-slate-100 rounded-full transition-colors">
                    <IcoBack />
                </button>
                <div className="ml-2 flex-1 min-w-0">
                    <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">Conversation</h1>
                </div>
            </header>

            {/* ─── 2. SCROLLABLE MESSAGES AREA ─── */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center px-6">
                        <p className="text-sm text-slate-500 font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
                            Send a message to start negotiating.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, idx) => {
                            const isMe = msg.senderId === user?._id;
                            // Show timestamp if it's the first message, or > 5 mins since last message
                            const showTime = idx === 0 || new Date(msg.createdAt) - new Date(messages[idx - 1].createdAt) > 5 * 60 * 1000;

                            return (
                                <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>

                                    {showTime && (
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest my-3 self-center bg-slate-200/50 px-2 py-0.5 rounded">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}

                                    <div
                                        className={`px-4 py-2.5 max-w-[75%] rounded-2xl text-[14px] leading-relaxed shadow-sm ${isMe
                                                ? 'bg-slate-900 text-white rounded-br-sm'
                                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Invisible div to scroll to */}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>
                )}
            </main>

            {/* ─── 3. FIXED INPUT FOOTER ─── */}
            <footer className="shrink-0 bg-white border-t border-slate-200 p-3 pb-safe">
                <form onSubmit={handleSend} className="flex gap-2 items-end max-w-3xl mx-auto">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-5 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors h-12"
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="w-12 h-12 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400"
                    >
                        <IcoSend />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatScreen;