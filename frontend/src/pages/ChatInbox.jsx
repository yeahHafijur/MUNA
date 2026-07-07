import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';

const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IcoChat = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;

const ChatInbox = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const { data: sessions = [], isLoading } = useQuery({
        queryKey: ['chatSessions'],
        queryFn: async () => {
            const res = await fetch('/api/chat/sessions', { credentials: 'include', 
                
            });
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
        enabled: true,
        refetchInterval: 5000
    });

    return (
        /* Fixed Viewport Shell to bypass App.jsx padding */
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 font-sans overflow-hidden">

            {/* Header - Fixed Height */}
            <header className="shrink-0 h-14 bg-white border-b border-slate-200 flex items-center px-4 z-50">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 active:bg-slate-100 rounded-full transition-colors">
                    <IcoBack />
                </button>
                <h1 className="text-lg font-bold text-slate-900 ml-2 tracking-tight">Messages</h1>
            </header>

            {/* Scrollable Content Area */}
            <main className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    // Skeleton Loader
                    [1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100">
                            <div className="w-14 h-14 bg-slate-100 rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-2.5">
                                <div className="h-3.5 bg-slate-100 rounded w-1/3 animate-pulse"></div>
                                <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse"></div>
                            </div>
                        </div>
                    ))
                ) : sessions.length === 0 ? (
                    // Empty State
                    <div className="h-full flex flex-col items-center justify-center text-center px-6 text-slate-400 animate-in fade-in duration-500">
                        <div className="mb-4 text-slate-300"><IcoChat /></div>
                        <h2 className="text-lg font-bold text-slate-900 mb-1.5">No messages yet</h2>
                        <p className="text-sm text-slate-500">Your conversations will appear here.</p>
                    </div>
                ) : (
                    // Chat List
                    <div className="space-y-3 animate-in fade-in duration-300">
                        {sessions.map(session => {
                            const isBuyer = session.buyerId?._id === user?._id;
                            const otherPerson = isBuyer ? session.sellerId : session.buyerId;

                            return (
                                <div
                                    key={session._id}
                                    onClick={() => navigate(`/chat/${session._id}`)}
                                    className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4 active:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-full bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                                        <img
                                            src={otherPerson?.profilePicture ? optimizeImage(otherPerson.profilePicture, 100) : "https://api.dicebear.com/7.x/initials/svg?seed=" + otherPerson?.name}
                                            alt={otherPerson?.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="text-sm font-bold text-slate-900 truncate pr-2">{otherPerson?.name || 'Unknown User'}</h3>
                                            <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                                                {new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate font-medium">{session.lastMessage || 'Tap to view...'}</p>

                                        {session.itemId && (
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-2 truncate bg-blue-50 px-2 py-0.5 rounded inline-block self-start">
                                                Re: {session.itemId.title}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatInbox;