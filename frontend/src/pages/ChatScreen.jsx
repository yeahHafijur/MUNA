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

    // Fetch messages (Poll every 2 seconds for real-time feel)
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

    // Send Message
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
            // Optimistic update
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            <header className="shrink-0 sticky top-0 inset-x-0 z-50 bg-white border-b border-slate-100 flex items-center px-4 py-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 active:bg-slate-100 rounded-full transition-colors">
                    <IcoBack />
                </button>
                <div className="ml-2 flex-1 min-w-0">
                    <h1 className="text-[17px] font-black text-slate-900 tracking-tight truncate">Conversation</h1>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isLoading && (
                    <div className="text-center text-slate-400 text-sm py-10 font-medium">
                        Send a message to start negotiating.
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?._id;
                    const showTime = idx === 0 || new Date(msg.createdAt) - new Date(messages[idx-1].createdAt) > 5 * 60 * 1000;
                    
                    return (
                        <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {showTime && (
                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest my-2 self-center">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}
                            <div 
                                className={`px-4 py-2.5 max-w-[75%] rounded-2xl text-[15px] leading-snug shadow-sm ${
                                    isMe 
                                    ? 'bg-amber-400 text-amber-950 rounded-tr-sm font-semibold' 
                                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
                                }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

            <footer className="shrink-0 bg-white border-t border-slate-100 p-3 pb-8 sm:pb-3">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm font-medium focus:outline-none focus:border-amber-400 focus:bg-white transition-colors"
                    />
                    <button 
                        type="submit" 
                        disabled={!inputText.trim()}
                        className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50"
                    >
                        <IcoSend />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatScreen;
