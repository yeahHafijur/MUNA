import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { socket } from '../utils/socket';

const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IcoSend = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>;
const IcoDoubleTick = ({ read }) => (
    <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 inline-block ml-1 -mb-1 ${read ? 'text-blue-400' : 'text-slate-400'}`}>
        <path d="M4 12l4 4 8-8M10 16l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChatScreen = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const queryClient = useQueryClient();
    
    const messagesEndRef = useRef(null);
    const observerTarget = useRef(null);
    
    const [inputText, setInputText] = useState('');

    // Infinite Query for pagination
    const { 
        data, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        isLoading 
    } = useInfiniteQuery({
        queryKey: ['chatMessages', sessionId],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await fetch(`/api/chat/sessions/${sessionId}/messages?page=${pageParam}&limit=30`, {
                
            });
            if (!res.ok) throw new Error('Failed to fetch messages');
            return res.json();
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled:  !!sessionId,
    });

    // Flatten pages: page 1 is latest (but reversed), page 2 is older. 
    // We want older messages at the top, so we reverse the pages array.
    const messages = data ? [...data.pages].reverse().flatMap(page => page.messages) : [];

    // Intersection Observer for Infinite Scrolling
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    // Save current scroll height to maintain position
                    const container = document.getElementById('chat-scroll-container');
                    const oldHeight = container ? container.scrollHeight : 0;
                    
                    fetchNextPage().then(() => {
                        // Adjust scroll position after loading older messages
                        setTimeout(() => {
                            if (container) {
                                container.scrollTop = container.scrollHeight - oldHeight;
                            }
                        }, 50);
                    });
                }
            },
            { threshold: 0.1 }
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // WebSocket Integration
    useEffect(() => {
        if (!sessionId) return;
        socket.connect();
        socket.emit("join_room", sessionId);

        const handleReceiveMessage = (message) => {
            queryClient.setQueryData(['chatMessages', sessionId], (oldData) => {
                if (!oldData) return oldData;
                const newPages = [...oldData.pages];
                // page 0 contains the newest messages
                newPages[0] = {
                    ...newPages[0],
                    messages: [message, ...newPages[0].messages]
                };
                return { ...oldData, pages: newPages };
            });

            // If I receive a message not sent by me, mark it as read immediately
            if (message.senderId !== user._id) {
                socket.emit("mark_as_read", { sessionId, messageIds: [message._id] });
            }

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        };

        const handleMessagesRead = (messageIds) => {
            queryClient.setQueryData(['chatMessages', sessionId], (oldData) => {
                if (!oldData) return oldData;
                const newPages = oldData.pages.map(page => ({
                    ...page,
                    messages: page.messages.map(msg => 
                        messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
                    )
                }));
                return { ...oldData, pages: newPages };
            });
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("messages_read", handleMessagesRead);

        // Bulk mark unread as read on open
        if (messages.length > 0) {
            const unreadIds = messages.filter(m => m.senderId !== user._id && !m.isRead).map(m => m._id);
            if (unreadIds.length > 0) {
                socket.emit("mark_as_read", { sessionId, messageIds: unreadIds });
            }
        }

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("messages_read", handleMessagesRead);
            socket.disconnect();
        };
    }, [sessionId, queryClient, user._id, messages.length]);

    // Initial scroll to bottom
    useEffect(() => {
        if (messages.length > 0 && data?.pages.length === 1) {
            messagesEndRef.current?.scrollIntoView();
        }
    }, [data?.pages.length]);

    // Send Message Mutation
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
            const previousData = queryClient.getQueryData(['chatMessages', sessionId]);

            const optimisticMsg = {
                _id: Date.now().toString(),
                sessionId,
                senderId: user._id,
                text: newText,
                createdAt: new Date().toISOString(),
                isRead: false
            };

            queryClient.setQueryData(['chatMessages', sessionId], (oldData) => {
                if (!oldData) return oldData;
                const newPages = [...oldData.pages];
                newPages[0] = {
                    ...newPages[0],
                    messages: [optimisticMsg, ...newPages[0].messages]
                };
                return { ...oldData, pages: newPages };
            });

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);

            return { previousData };
        },
        onError: (err, newText, context) => {
            queryClient.setQueryData(['chatMessages', sessionId], context.previousData);
        },
        onSettled: () => {
            // queryClient.invalidateQueries(['chatMessages', sessionId]); // No longer needed, socket handles sync!
            queryClient.invalidateQueries(['chatSessions']);
        }
    });

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        sendMutation.mutate(inputText.trim());
        setInputText('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 font-sans overflow-hidden">
            <header className="shrink-0 h-14 bg-white border-b border-slate-200 flex items-center px-4 z-50">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 active:bg-slate-100 rounded-full transition-colors">
                    <IcoBack />
                </button>
                <div className="ml-2 flex-1 min-w-0">
                    <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">Conversation</h1>
                </div>
            </header>

            <main id="chat-scroll-container" className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Intersection Observer Target for Loading More */}
                <div ref={observerTarget} className="h-4 flex justify-center items-center">
                    {isFetchingNextPage && <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>}
                </div>

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
                            const showTime = idx === 0 || new Date(msg.createdAt) - new Date(messages[idx - 1].createdAt) > 5 * 60 * 1000;

                            return (
                                <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showTime && (
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest my-3 self-center bg-slate-200/50 px-2 py-0.5 rounded">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}

                                    <div
                                        className={`px-4 py-2.5 max-w-[75%] rounded-2xl text-[14px] leading-relaxed shadow-sm flex items-end gap-2 ${isMe
                                                ? 'bg-slate-900 text-white rounded-br-sm'
                                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                                            }`}
                                    >
                                        <span className="whitespace-pre-wrap">{msg.text}</span>
                                        {isMe && <IcoDoubleTick read={msg.isRead} />}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>
                )}
            </main>

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