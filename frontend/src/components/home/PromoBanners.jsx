import { memo } from 'react';

const PromoBanners = ({ banners }) => {
    if (!banners || banners.length === 0) return null;

    return (
        <div className="pt-4 pb-2">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4">
                {banners.map(b => (
                    <div 
                        key={b._id} 
                        onClick={() => { if(b.link) window.location.href = b.link; }}
                        className="snap-center shrink-0 w-[90vw] sm:w-[360px] h-[160px] rounded-[20px] overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative"
                    >
                        <img src={b.image} alt="Promo Banner" className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default memo(PromoBanners);
