import { memo } from 'react';
import { getCategoryIcon } from '../../utils/homeUtils.js';

const AllCategoriesModal = ({ showAllCategories, setShowAllCategories, categoryList, activeCategory, setActiveCategory }) => {
    if (!showAllCategories) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
                <button onClick={() => setShowAllCategories(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition-transform">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                </button>
                <h2 className="text-[16px] font-black text-slate-900 tracking-tight">All Categories</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-6 gap-x-3">
                    {categoryList.map(catObj => {
                        const catName = catObj.name;
                        const isActive = activeCategory === catName;
                        const { emoji, bg } = getCategoryIcon(catName);
                        return (
                            <button
                                key={catName}
                                onClick={() => {
                                    setShowAllCategories(false);
                                    setActiveCategory(catName);
                                    // Optional: Scroll to store listing
                                    setTimeout(() => {
                                        const storeList = document.getElementById('store-listing');
                                        if (storeList) {
                                            storeList.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }, 100);
                                }}
                                className="flex flex-col items-center gap-2 active:opacity-60 transition-opacity"
                            >
                                <div className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-[32px] overflow-hidden shadow-sm ${isActive ? 'ring-2 ring-slate-900 bg-slate-50' : bg}`}>
                                    {catObj.image ? (
                                        <img src={catObj.image} alt={catName} className="w-full h-full object-cover" />
                                    ) : (
                                        emoji
                                    )}
                                </div>
                                <span className={`text-[11px] text-center leading-tight px-1 ${isActive ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                    {catName === 'All' ? 'All' : catName}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default memo(AllCategoriesModal);
