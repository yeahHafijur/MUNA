import { optimizeImage } from '../../utils/imageUtils';

const ShopHero = ({ shop }) => {
    if (!shop) return null;

    return (
        <div className="sd-hero">
            {shop.image ? (
                <img src={optimizeImage(shop.image)} alt={shop.name} className="sd-hero-img" />
            ) : (
                <div className="sd-hero-placeholder w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
                </div>
            )}
            <div className="sd-hero-gradient" />
            <div className="sd-hero-content">
                <span className={`sd-hero-status ${shop.isOpen ? 'sd-hero-status--open' : 'sd-hero-status--closed'}`}>
                    <span className="sd-hero-status-dot" />
                    {shop.isOpen ? 'Open Now' : 'Closed'}
                </span>
                <h1 className="sd-hero-name">{shop.name}</h1>
                <div className="sd-hero-info">
                    <span className="sd-hero-info-item">📍 {shop.address}</span>
                    {shop.vendorId?.phone && (
                        <span className="sd-hero-info-item">📞 {shop.vendorId.phone}</span>
                    )}
                    {shop.location?.coordinates && (
                        <button
                            className="sd-hero-dir-btn"
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.location.coordinates[1]},${shop.location.coordinates[0]}`, '_blank')}
                        >
                            🗺️ Directions
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopHero;
