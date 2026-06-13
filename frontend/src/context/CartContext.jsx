import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // Initialize from localStorage if available
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem('cartItems');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [cartShopId, setCartShopId] = useState(() => {
        try {
            return localStorage.getItem('cartShopId') || null;
        } catch {
            return null;
        }
    });

    // Save to localStorage whenever cart state changes
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        if (cartShopId) {
            localStorage.setItem('cartShopId', cartShopId);
        } else {
            localStorage.removeItem('cartShopId');
        }
    }, [cartItems, cartShopId]);

    const addToCart = (product, shopId) => {
        // THE ZOMATO / BLINKIT RULE: Single Shop Validation
        if (cartShopId && cartShopId !== shopId) {
            alert("You can only order from one shop at a time! Please clear your cart first to order from a different shop.");
            return false;
        }

        // Pehli baar saman add hone par shop lock kar do
        if (!cartShopId) {
            setCartShopId(shopId);
        }

        setCartItems(prev => {
            const existing = prev.find(item => item.productId === product._id);
            if (existing) {
                // Agar pehle se cart me hai toh bas quantity badha do
                return prev.map(item =>
                    item.productId === product._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            // Naya item add karo
            return [...prev, {
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: 1
            }];
        });

        return true;
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => {
            const updated = prev.filter(item => item.productId !== productId);
            // Agar cart khali ho gaya toh Shop Lock hata do
            if (updated.length === 0) {
                setCartShopId(null);
            }
            return updated;
        });
    };

    const clearCart = () => {
        setCartItems([]);
        setCartShopId(null);
    };

    const getTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    return (
        <CartContext.Provider value={{ cartItems, cartShopId, addToCart, removeFromCart, clearCart, getTotal }}>
            {children}
        </CartContext.Provider>
    );
};
