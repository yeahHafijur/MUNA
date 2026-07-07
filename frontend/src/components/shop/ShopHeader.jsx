import React from 'react';
import { Link } from 'react-router-dom';

const IcoBack = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);
const IcoCart = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const ShopHeader = ({ shop, totalCartItems, navigate }) => {
    return (
        <header className="sd-header">
            <div className="sd-header-row">
                <button className="sd-back-btn" onClick={() => navigate(-1)}>
                    <IcoBack />
                </button>
                <span className="sd-header-title">
                    {shop?.name || 'Shop'}
                </span>
                <div className="sd-header-actions">
                    <Link to="/cart" className="sd-hdr-btn" title="Cart">
                        <IcoCart />
                        {totalCartItems > 0 && (
                            <span key={totalCartItems} className="sd-hdr-badge">{totalCartItems}</span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default ShopHeader;
