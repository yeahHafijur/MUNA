import { memo } from 'react';

const StoreSkeleton = () => {
    return (
        <div className="rounded-[20px] overflow-hidden animate-pulse bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col">
            {/* Image Area */}
            <div className="w-full aspect-[4/3] bg-slate-200" />
            
            {/* Bottom Info Strip */}
            <div className="px-3 py-3 flex flex-col gap-2 bg-gradient-to-r from-slate-50 to-white">
                <div className="h-3 bg-slate-200 rounded-full w-2/3" />
                <div className="h-2.5 bg-slate-200 rounded-full w-1/3" />
            </div>
        </div>
    );
};

export default memo(StoreSkeleton);
