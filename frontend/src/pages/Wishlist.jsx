import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';

/* ─── Premium Crisp Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconHeart = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-rose-500"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;

const Wishlist = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const { data: wishlist = [], isLoading, isError } = useQuery({
        queryKey: ['wishlist'],
        queryFn: async () => {
            const res = await fetch('/api/user/wishlist', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch wishlist');
            return res.json();
        },
        enabled: !!token
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center text-2xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Failed to load</h2>
                <p className="text-sm font-medium text-slate-500 mb-8">We couldn't fetch your saved items right now.</p>
                <button onClick={() => navigate(-1)} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl active:scale-[0.98] transition-transform">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-28">

            {/* ─── GLASSMORPHISM HEADER ─── */}
            <div className="bg-white/70 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-slate-100/50">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                >
                    <IconBack />
                </button>
                <span className="text-base font-black text-slate-900 tracking-tight">Saved Items</span>
                <div className="w-10" />
            </div>

            {/* ─── CONTENT AREA ─── */}
            <div className="p-4 sm:p-6 max-w-5xl mx-auto">
                {wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-24 text-center px-4 animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                            <span className="text-4xl opacity-20">🤍</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">No saved items</h2>
                        <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mb-8 leading-relaxed">
                            Items you like will appear here. Start browsing to build your wishlist.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl active:scale-[0.98] transition-transform shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-500">
                        {wishlist.map(product => (
                            <div
                                key={product._id}
                                onClick={() => navigate(`/shop/${product.shopId}/product/${product._id}`)}
                                className="bg-white rounded-2xl p-3 flex flex-col shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="aspect-[4/5] w-full bg-[#F8FAFC] rounded-xl mb-3 overflow-hidden flex items-center justify-center p-4 relative group-hover:bg-[#F1F5F9] transition-colors">
                                    <div className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-rose-500 shadow-sm">
                                        <IconHeart />
                                    </div>
                                    {product.image ? (
                                        <img
                                            src={optimizeImage(product.image, 400)}
                                            alt={product.name}
                                            className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <span className="text-3xl opacity-20">🛍️</span>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-end">
                                    <h3 className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 mb-2 group-hover:text-slate-700 transition-colors">{product.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-black text-slate-900 tracking-tight">₹{product.price}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;