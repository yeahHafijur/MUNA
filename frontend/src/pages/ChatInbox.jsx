import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';

const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IcoChat = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;

const ChatInbox = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const { data: sessions = [], isLoading } = useQuery({
        queryKey: ['chatSessions'],
        queryFn: async () => {
            const res = await fetch('/api/chat/sessions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
        enabled: !!token,
        refetchInterval: 5000 // Poll every 5s for new messages
    });

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            <header className="sticky top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-4 py-3 shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 active:bg-slate-100 rounded-full transition-colors">
                    <IcoBack />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight ml-2">Messages</h1>
            </header>

            <main className="p-4 space-y-3">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 items-center animate-pulse bg-white p-4 rounded-2xl">
                            <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-4 text-slate-400">
                        <IcoChat />
                        <h2 className="text-xl font-bold text-slate-800 mt-4 mb-2">No messages yet</h2>
                        <p className="text-sm text-slate-500 max-w-[250px]">Your conversations from Daily Market will appear here.</p>
                    </div>
                ) : (
                    sessions.map(session => {
                        const isBuyer = session.buyerId?._id === user?._id;
                        const otherPerson = isBuyer ? session.sellerId : session.buyerId;
                        
                        return (
                            <div 
                                key={session._id} 
                                onClick={() => navigate(`/chat/${session._id}`)}
                                className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <img 
                                    src={otherPerson?.profilePicture ? optimizeImage(otherPerson.profilePicture, 100) : "https://api.dicebear.com/7.x/initials/svg?seed=" + otherPerson?.name} 
                                    className="w-14 h-14 rounded-full bg-slate-100 object-cover shrink-0"
                                />
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-[15px] font-bold text-slate-900 truncate pr-2">{otherPerson?.name || 'Unknown User'}</h3>
                                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                            {new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate font-medium">{session.lastMessage || 'Start a conversation...'}</p>
                                    
                                    {session.itemId && (
                                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1.5 truncate">
                                            Re: {session.itemId.title}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </main>
        </div>
    );
};

export default ChatInbox;
