import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { optimizeImage } from '../utils/imageUtils';

/* ─── Icons ─── */
const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IcoLocation = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const IcoAdd = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const IcoChat = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
const IcoClock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const DailyMarket = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [location, setLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(true);

    // Get User Location
    useEffect(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setIsLocating(false);
            },
            (error) => {
                toast.error("Please enable location to see nearby items");
                setIsLocating(false);
            }
        );
    }, []);

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['dailyMarketItems', location?.lat, location?.lng],
        queryFn: async () => {
            if (!location) return [];
            const res = await fetch(`/api/live-bazar?lat=${location.lat}&lng=${location.lng}&maxDistance=1000`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch items');
            return res.json();
        },
        enabled: !!location,
    });

    // Start Chat Mutation
    const startChatMutation = useMutation({
        mutationFn: async (item) => {
            const res = await fetch('/api/chat/sessions', { credentials: 'include', 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sellerId: item.userId._id, itemId: item._id })
            });
            if (!res.ok) throw new Error('Failed to start chat');
            return res.json();
        },
        onSuccess: (session) => {
            if (navigator.vibrate) navigator.vibrate(30);
            navigate(`/chat/${session._id}`);
        },
        onError: (err) => {
            toast.error(err.message || "Cannot start chat.");
        }
    });

    const formatTimeLeft = (expiresAt) => {
        const diff = new Date(expiresAt) - new Date();
        if (diff <= 0) return 'Expired';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m left`;
    };

    return (
        /* Fixed Viewport Shell to bypass App.jsx padding */
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 font-sans overflow-hidden">
            {/* Header */}
            <header className="shrink-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 active:bg-slate-100 rounded-full transition-colors">
                        <IcoBack />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">MunaDailyMarket</h1>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Live near you
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/chat')}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 relative active:bg-slate-200 transition-colors"
                >
                    <IcoChat />
                </button>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4 pb-24 relative">
                {isLocating ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <IcoLocation />
                        <p className="text-sm font-semibold mt-4 animate-pulse">Finding items near you...</p>
                    </div>
                ) : !location ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-4">
                        <IcoLocation />
                        <p className="text-sm font-semibold mt-4 text-slate-600">Location Access Required</p>
                        <p className="text-xs mt-2">We need your location to show items selling nearby.</p>
                    </div>
                ) : isLoading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-slate-200 animate-pulse rounded-3xl aspect-[3/4]"></div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                        <div className="w-20 h-20 mb-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a2.25 2.25 0 002.25-2.25v-.75a2.25 2.25 0 00-2.25-2.25h-3a.75.75 0 01-.75-.75V5.25a.75.75 0 01.75-.75h3A2.25 2.25 0 0019.5 2.25v-.75A2.25 2.25 0 0017.25 0h-3a.75.75 0 01-.75-.75V-3" /></svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">No active items nearby</h2>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-[250px]">Be the first to sell something in your neighborhood today!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {items.map(item => (
                            <div 
                                key={item._id} 
                                onClick={() => navigate(`/daily-market/item/${item._id}`)}
                                className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative group cursor-pointer"
                            >
                                <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 text-white shadow-sm">
                                    <IcoClock />
                                    <span className="text-[10px] font-bold tracking-wider">{formatTimeLeft(item.expiresAt)}</span>
                                </div>
                                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                    <img src={optimizeImage(item.image, 400)} alt={item.title} className="w-full h-full object-cover group-active:scale-105 transition-transform duration-300" />
                                </div>
                                <div className="p-3.5 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={item.userId?.profilePicture ? optimizeImage(item.userId.profilePicture, 100) : "https://api.dicebear.com/7.x/initials/svg?seed=" + item.userId?.name} className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{item.userId?.name}</span>
                                    </div>
                                    <h3 className="text-[13px] font-bold text-slate-900 leading-tight mb-2 line-clamp-2 flex-1">{item.title}</h3>
                                    <div className="flex items-end justify-between mt-auto">
                                        <span className="text-lg font-black text-slate-900 tracking-tight">₹{item.price}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!user) { toast.error("Please login first"); navigate('/login'); return; }
                                            startChatMutation.mutate(item);
                                        }}
                                        disabled={startChatMutation.isPending || item.userId._id === user?._id}
                                        className="w-full mt-3 py-2.5 bg-amber-400 text-amber-950 text-xs font-black uppercase tracking-wider rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                                    >
                                        I'm Interested
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Sell Button */}
            <button
                onClick={() => {
                    if (!user) { toast.error("Please login to sell"); navigate('/login'); return; }
                    navigate('/daily-market/post');
                }}
                className="absolute bottom-6 right-4 z-50 bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(15,23,42,0.4)] active:scale-90 transition-transform"
            >
                <IcoAdd />
            </button>
        </div>
    );
};

export default DailyMarket;
