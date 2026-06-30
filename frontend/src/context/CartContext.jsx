import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try { return JSON.parse(localStorage.getItem('cartItems')) || []; } catch { return []; }
    });

    const [cartShopId, setCartShopId] = useState(() => localStorage.getItem('cartShopId') || null);

    // 1. Storage Sync: Update cart if user modifies it in another browser tab (Premium UX)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'cartItems') setCartItems(e.newValue ? JSON.parse(e.newValue) : []);
            if (e.key === 'cartShopId') setCartShopId(e.newValue || null);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Save to local storage on state change
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        if (cartShopId) localStorage.setItem('cartShopId', cartShopId);
        else localStorage.removeItem('cartShopId');
    }, [cartItems, cartShopId]);

    const addToCart = (product, shopId) => {
        // THE ZOMATO / BLINKIT RULE
        if (cartShopId && cartShopId !== shopId) {
            // UI component ko object return karo takki wo "Replace Cart" wala popup dikha sake
            return { success: false, error: 'DIFFERENT_SHOP_ERROR' }; 
        }

        if (!cartShopId) setCartShopId(shopId);

        setCartItems(prev => {
            const existing = prev.find(item => item.productId === product._id);
            if (existing) {
                return prev.map(item => item.productId === product._id 
                    ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { productId: product._id, name: product.name, price: product.price, quantity: 1 }];
        });
        return { success: true };
    };

    // 2. New Function: Isko UI (Popup Modal) se call karna jab user dusre shop se order start karna chahe
    const overrideAndReplaceCart = (product, shopId) => {
        setCartShopId(shopId);
        setCartItems([{ productId: product._id, name: product.name, price: product.price, quantity: 1 }]);
        toast.success("Previous cart cleared. New item added!");
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems(prev => prev.map(item =>
            item.productId === productId ? { ...item, quantity: newQuantity } : item
        ));
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => {
            const updated = prev.filter(item => item.productId !== productId);
            if (updated.length === 0) setCartShopId(null);
            return updated;
        });
    };

    const clearCart = () => {
        setCartItems([]);
        setCartShopId(null);
    };

    const getTotal = () => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cartItems, cartShopId, addToCart, overrideAndReplaceCart, updateQuantity, removeFromCart, clearCart, getTotal }}>
            {children}
        </CartContext.Provider>
    );
};
