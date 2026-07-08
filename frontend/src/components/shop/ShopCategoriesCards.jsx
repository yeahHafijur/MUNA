import React from 'react';
import { optimizeImage } from '../../utils/imageUtils';

const ShopCategoriesCards = ({ categories, products, getCatImage, setSelectedCategory }) => {
    return (
        <>
            <div className="sd-sec-head">
                <h2 className="sd-sec-title">Browse by Category</h2>
                <span className="sd-sec-count">{categories.length + 1} categories</span>
            </div>
            <div className="sd-cat-grid">
                {/* All Items card */}
                <div
                    className="sd-cat-card sd-cat-card--all"
                    onClick={() => setSelectedCategory('All')}
                >
                    <div className="sd-cat-content">
                        <div className="sd-cat-name">All Items</div>
                        <div className="sd-cat-count">{products.length} items</div>
                    </div>
                </div>

                {categories.map((cat, idx) => {
                    const count = products.filter(p => {
                        const pCatName = typeof p.category === 'object' ? (p.category?.name || 'General') : (p.category || 'General');
                        return pCatName === cat;
                    }).length;
                    const customImg = getCatImage(cat);
                    return (
                        <div
                            key={cat}
                            className={`sd-cat-card ${customImg ? 'sd-cat-card--has-img' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {customImg ? (
                                <>
                                    <img src={optimizeImage(customImg)} alt={cat} className="sd-cat-bg-img" />
                                    <div className="sd-cat-overlay"></div>
                                </>
                            ) : (
                                <span className="sd-cat-emoji" style={{ fontSize: '28px' }}>🏷</span>
                            )}
                            <div className="sd-cat-content">
                                <div className="sd-cat-name">{cat}</div>
                                <div className="sd-cat-count">{count} items</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default ShopCategoriesCards;
