import React from 'react';
import { optimizeImage } from '../../utils/imageUtils';

const ShopHero = ({ shop }) => {
    if (!shop) return null;

    return (
        <div className="sd-hero">
            {shop.image ? (
                <img src={optimizeImage(shop.image)} alt={shop.name} className="sd-hero-img" />
            ) : (
                <div className="sd-hero-placeholder">🏪</div>
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
