import { memo } from 'react';

const MidPageBanner = ({ banners }) => {
    // Show the first active mid banner, or fallback to the static one
    const banner = banners && banners.length > 0 ? banners[0] : { image: '/promo-banner-free-delivery.png', link: '' };

    return (
        <div className="px-4 py-2 mt-4 mb-2 md:mx-4">
            <div 
                onClick={() => { if(banner.link) window.location.href = banner.link; }}
                className="w-full rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(16,185,129,0.25)] cursor-pointer hover:shadow-[0_12px_40px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all duration-300"
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
