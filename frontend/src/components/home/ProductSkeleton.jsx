import { memo } from 'react';

const ProductSkeleton = () => {
    return (
        <div className="w-[140px] sm:w-[160px] shrink-0 animate-pulse bg-white p-2 rounded-[16px] border border-slate-100 shadow-sm">
            {/* Image Placeholder */}
            <div className="h-[120px] bg-slate-200 rounded-[12px] w-full mb-3"></div>
            {/* Text Placeholders */}
            <div className="h-3 bg-slate-200 rounded-full w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded-full w-1/2 mb-3"></div>
            {/* Button Placeholder */}
            <div className="h-8 bg-slate-200 rounded-lg w-full mt-2"></div>
        </div>
    );
};

export default memo(ProductSkeleton);
