import { memo } from 'react';
import { getCategoryIcon } from '../../utils/homeUtils.js';

const QuickCategories = ({ categoryList, setActiveCategory }) => {
    // Show top 8 categories (exclude 'All' if it's the first one, but let's just slice)
    // categoryList usually has 'All' as the first item. We can skip 'All' for the quick grid if we want, or keep it.
    // Let's keep the first 8 items excluding 'All' for maximum relevance, or include 'All' as a fallback.
    const displayCats = categoryList.filter(c => c.name !== 'All').slice(0, 8);

    return (
        <div className="bg-white px-4 py-6 border-b border-slate-100 mb-2 md:rounded-2xl md:mx-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-black text-slate-900">Explore Categories</h3>
            </div>
            <div className="grid grid-cols-4 gap-y-5 gap-x-3">
                {displayCats.map(cat => {
                    const { emoji, bg } = getCategoryIcon(cat.name);
                    return (
                        <button 
                            key={cat.name} 
                            onClick={() => {
                                setActiveCategory(cat.name);
                                const storeList = document.getElementById('store-listing');
                                if (storeList) {
                                    storeList.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }}
                            className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                        >
                            <div className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100 ${bg}`}>
                                {cat.image ? (
                                    <img src={cat.image} alt={cat.name} className="w-10 h-10 object-contain drop-shadow-sm" />
                                ) : (
                                    <span className="drop-shadow-sm">{emoji}</span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 text-center leading-tight truncate w-full px-1">
                                {cat.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default memo(QuickCategories);
