import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/imageUtils';

/* ─── Standard Native Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconHeart = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const IconPlaceholder = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;
const IconEmptyState = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;

const Wishlist = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const { data: wishlist = [], isLoading, isError } = useQuery({
        queryKey: ['wishlist'],
        queryFn: async () => {
            const res = await fetch('/api/user/wishlist', { credentials: 'include', 
                
            });
            if (!res.ok) throw new Error('Failed to fetch wishlist');
            return res.json();
        },
        enabled: true
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm font-medium text-gray-500 mb-4">We couldn't fetch your saved items.</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-8">

            {/* ─── STANDARD HEADER ─── */}
            <div className="bg-white px-2 py-2 flex items-center border-b border-gray-200 sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 text-gray-800"
                >
                    <IconBack />
                </button>
                <span className="text-base font-semibold text-gray-900 ml-2">Wishlist</span>
            </div>

            {/* ─── CONTENT AREA ─── */}
            <div className="p-3 sm:p-4 max-w-5xl mx-auto">
                {wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-32 text-center px-4">
                        <div className="mb-4">
                            <IconEmptyState />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">No items saved</h2>
                        <p className="text-sm text-gray-500 mb-6 max-w-xs">
                            Items you like will appear here. Build your wishlist by tapping the heart icon on products.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg active:bg-gray-800 transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {wishlist.map(product => (
                            <div
                                key={product._id}
                                onClick={() => navigate(`/shop/${product.shopId}/product/${product._id}`)}
                                className="bg-white rounded-lg p-3 border border-gray-200 flex flex-col active:bg-gray-50 cursor-pointer"
                            >
                                <div className="aspect-square w-full bg-white rounded mb-3 flex items-center justify-center relative">
                                    <div className="absolute top-1 right-1 z-10 p-1 bg-white rounded-full shadow-sm">
                                        <IconHeart />
                                    </div>
                                    {product.image ? (
                                        <img
                                            src={optimizeImage(product.image, 400)}
                                            alt={product.name}
                                            className="w-full h-full object-contain mix-blend-multiply"
                                        />
                                    ) : (
                                        <IconPlaceholder />
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 mb-1">
                                        {product.name} {product.quantity && <span className="text-gray-500">({product.quantity})</span>}
                                    </h3>
                                    <span className="text-sm font-semibold text-gray-900 mt-auto">₹{product.price}</span>
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