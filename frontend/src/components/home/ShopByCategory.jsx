import { memo } from 'react';
import { getCategoryIcon } from '../../utils/homeUtils.js';

const ShopByCategory = ({ categoryList, activeCategory, setActiveCategory, setShowAllCategories }) => {
    return (
        <div className="bg-white px-4 py-6 border-y border-slate-100 mb-2 md:rounded-2xl md:mx-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-black text-slate-900">Shop by Category</h3>
                <span className="text-[12px] font-bold text-amber-500 cursor-pointer" onClick={() => setShowAllCategories(true)}>View All</span>
            </div>

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
                {categoryList.map(catObj => {
                    const catName = catObj.name;
                    const isActive = activeCategory === catName;
                    const { emoji, bg } = getCategoryIcon(catName);
                    return (
                        <button
                            key={catName}
                            onClick={() => {
                                setActiveCategory(catName);
                                const storeList = document.getElementById('store-listing');
                                if (storeList) {
                                    storeList.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }}
                            className="flex flex-col items-center gap-2 snap-start shrink-0 w-[72px] active:opacity-60 transition-opacity"
                        >
                            <div className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-[32px] overflow-hidden ${isActive ? 'ring-2 ring-slate-900 shadow-md bg-slate-50' : bg}`}>
                                {catObj.image ? (
                                    <img src={catObj.image} alt={catName} className="w-full h-full object-cover" />
                                ) : (
                                    emoji
                                )}
                            </div>
                            <span className={`text-[11px] text-center leading-tight px-1 ${isActive ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                                {catName === 'All' ? 'All' : catName}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default memo(ShopByCategory);
