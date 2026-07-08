import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { optimizeImage } from '../utils/imageUtils';

const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IcoClock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IcoLocation = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;

const DailyMarketItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();

    // Fetch Item Data
    const { data: item, isLoading, error } = useQuery({
        queryKey: ['dailyMarketItem', id],
        queryFn: async () => {
            const res = await fetch(`/api/live-bazar/${id}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Item not found');
            return res.json();
        }
    });

    // Start Chat Mutation
    const startChatMutation = useMutation({
        mutationFn: async (targetItem) => {
            const res = await fetch('/api/chat/session/live-bazar', { credentials: 'include', 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ liveBazarItemId: targetItem._id })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to start chat");
            }
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

    const handleGetDirection = () => {
        if (item?.location?.coordinates) {
            const [lng, lat] = item.location.coordinates;
            // Open Google Maps in a new tab/app
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 px-4">
                <p className="text-slate-500 mb-4">{error?.message || "Item not found"}</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-200 rounded-full font-bold text-slate-700">Go Back</button>
            </div>
        );
    }

    const isOwner = item.userId?._id === user?._id;

    return (
        /* Fixed Viewport Shell */
        <div className="fixed inset-0 z-[100] flex flex-col bg-white font-sans overflow-hidden">
            
            {/* Header (Overlaid on image) */}
            <header className="absolute top-0 inset-x-0 z-50 flex items-center p-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center active:scale-90 transition-transform"
                >
                    <IcoBack />
                </button>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto pb-safe">
                {/* Image Section */}
                <div className="w-full aspect-square bg-slate-100 relative">
                    <img 
                        src={optimizeImage(item.image, 800)} 
                        alt={item.title} 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white shadow-md border border-white/10">
                        <IcoClock />
                        <span className="text-xs font-bold tracking-wider">{formatTimeLeft(item.expiresAt)}</span>
                    </div>
                </div>

                {/* Details Section */}
                <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">
                            {item.title}
                        </h1>
                        <div className="text-2xl font-black text-amber-500 shrink-0">
                            ₹{item.price}
                        </div>
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl mb-6 border border-slate-100">
                        <img 
                            src={item.userId?.profilePicture ? optimizeImage(item.userId.profilePicture, 100) : "https://api.dicebear.com/7.x/initials/svg?seed=" + item.userId?.name} 
                            className="w-10 h-10 rounded-full bg-slate-200" 
                            alt="seller"
                        />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posted By</p>
                            <p className="text-sm font-bold text-slate-900">{item.userId?.name}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {item.description || "No description provided."}
                        </p>
                    </div>
                </div>
            </main>

            {/* Fixed Bottom Action Bar */}
            <footer className="shrink-0 bg-white border-t border-slate-100 p-4 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex gap-3 max-w-md mx-auto">
                    <button 
                        onClick={handleGetDirection}
                        className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-slate-200 transition-colors"
                    >
                        <IcoLocation />
                        Get Direction
                    </button>

                    <button 
                        onClick={() => {
                            if (!user) { toast.error("Please login first"); navigate('/login'); return; }
                            startChatMutation.mutate(item);
                        }}
                        disabled={startChatMutation.isPending || isOwner}
                        className="flex-1 py-3.5 bg-amber-400 text-amber-950 rounded-xl font-black uppercase tracking-wider flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400"
                    >
                        {startChatMutation.isPending ? 'Connecting...' : isOwner ? 'Your Item' : "I'm Interested"}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default DailyMarketItemDetail;
