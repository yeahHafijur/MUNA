import React from 'react';
import ProductCard from '../ProductCard';

const ShopProductList = ({ filteredProducts, searchQuery, selectedCategory, cartItems, id, navigate, handleAddClick, updateQuantity }) => {
    return (
        <>
            <div className="sd-sec-head">
                <h2 className="sd-sec-title">
                    {searchQuery
                        ? `Results for "${searchQuery}"`
                        : selectedCategory === 'All'
                            ? 'All Items'
                            : selectedCategory}
                </h2>
                <span className="sd-sec-count">{filteredProducts.length} items</span>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-emoji">🔍</span>
                    <div className="sd-empty-title">No items found</div>
                    <div className="sd-empty-sub">
                        {searchQuery ? 'Try a different search term' : 'No items in this category'}
                    </div>
                </div>
            ) : (
                <div className="sd-prod-grid">
                    {filteredProducts.map((product, idx) => {
                        const inCart = cartItems.find(i => i.productId === product._id);
                        return (
                            <div key={product._id} style={{ animationDelay: `${idx * 40}ms` }} className="sd-prod-wrapper">
                                <ProductCard 
                                    product={product}
                                    onClick={() => navigate(`/shop/${id}/product/${product._id}`)}
                                    onAddClick={(e) => {
                                        e.stopPropagation();
                                        handleAddClick(e, product);
                                    }}
                                    quantity={inCart?.quantity || 0}
                                    onIncrement={(e) => {
                                        e.stopPropagation();
                                        updateQuantity(product._id, inCart.quantity + 1);
                                    }}
                                    onDecrement={(e) => {
                                        e.stopPropagation();
                                        updateQuantity(product._id, inCart.quantity - 1);
                                    }}
                                    discount="15%"
                                    deliveryTime="10 MINS"
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default ShopProductList;
