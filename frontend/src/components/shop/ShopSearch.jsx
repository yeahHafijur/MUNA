import React from 'react';

const IcoSearch = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ShopSearch = ({ searchQuery, setSearchQuery }) => {
    return (
        <div className="sd-search">
            <div className="sd-search-wrap">
                <IcoSearch />
                <input
                    type="search"
                    name="q"
                    id="shop-search-input"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="Search items, categories..."
                    className="sd-search-input"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button className="sd-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
            </div>
        </div>
    );
};

export default ShopSearch;
