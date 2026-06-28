import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';

/* ─── Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
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
                <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
                <p className="text-slate-500 font-medium">Failed to load wishlist. Please try again.</p>
                <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-transform">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-28">
            {/* ─── HEADER ─── */}
            <div className="bg-white px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-slate-100">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform">
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">My Wishlist</span>
                <div className="w-10" />
            </div>

            {/* ─── CONTENT ─── */}
            <div className="p-4">
                {wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 text-center">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                            <IconHeart />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mb-1.5">Your wishlist is empty</h2>
                        <p className="text-[13px] text-slate-500 font-medium px-4">
                            Looks like you haven't liked any items yet. Start exploring and save your favorites here!
                        </p>
                        <button 
                            onClick={() => navigate('/')} 
                            className="mt-6 px-8 py-3 bg-amber-400 text-amber-950 font-black rounded-xl active:scale-95 transition-transform shadow-sm"
                        >
                            Explore Items
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {wishlist.map(product => (
                            <div 
                                key={product._id}
                                onClick={() => navigate(`/shop/${product.shopId}/product/${product._id}`)}
                                className="bg-white rounded-2xl p-3 flex flex-col shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-slate-100 active:scale-95 transition-transform cursor-pointer"
                            >
                                <div className="aspect-square w-full bg-[#f8fafc] rounded-xl mb-3 overflow-hidden flex items-center justify-center p-2 relative">
                                    <div className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-rose-500 shadow-sm">
                                        <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                                    </div>
                                    {product.image ? (
                                        <img src={optimizeImage(product.image, 400)} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                                    ) : (
                                        <span className="text-3xl opacity-20">🛍️</span>
                                    )}
                                </div>
                                <h3 className="text-[13px] font-black text-slate-900 leading-tight mb-1 truncate">{product.name}</h3>
                                <div className="flex items-center justify-between mt-auto pt-1">
                                    <span className="text-[14px] font-black text-slate-900">₹{product.price}</span>
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
