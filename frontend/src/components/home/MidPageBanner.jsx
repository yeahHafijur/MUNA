import { memo } from 'react';

const MidPageBanner = ({ banners }) => {
    // Return null if no active banners
    if (!banners || banners.length === 0) return null;

    const banner = banners[0];

    return (
        <div className="px-4 py-2 mt-4 mb-2 md:mx-4">
            <div 
                onClick={() => { if(banner.link) window.location.href = banner.link; }}
                className="w-full rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(16,185,129,0.25)] cursor-pointer hover:shadow-[0_12px_40px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all duration-300"
            >
                <img 
                    src={banner.image} 
                    alt="Promo Banner" 
                    className="w-full h-auto object-cover md:max-h-[220px]"
                />
            </div>
        </div>
    );
};

export default memo(MidPageBanner);
