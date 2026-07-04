import { memo } from 'react';
import { IcoSearch } from './HomeIcons';

const GlobalSearchBar = ({ navigate }) => {
    return (
        <div className="px-4 pb-4 mt-2">
            <div
                onClick={() => navigate('/search')}
                className="w-full max-w-2xl mx-auto bg-white border border-slate-200 shadow-sm rounded-[14px] px-4 py-3.5 flex items-center gap-3 cursor-text active:scale-[0.99] transition-transform"
            >
                <span className="text-slate-400"><IcoSearch /></span>
                <span className="text-[13px] font-bold text-slate-400">Search for "Atta, Dal, Coke"</span>
            </div>
        </div>
    );
};

export default memo(GlobalSearchBar);
