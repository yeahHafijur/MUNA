import React, { createContext, useState, useContext, useEffect } from 'react';
import { ToastAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartShopId: string | null;
  addToCart: (product: any, shopId: string) => { success: boolean; error?: string };
  overrideAndReplaceCart: (product: any, shopId: string) => void;
  updateQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  isCartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Notice', message);
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartShopId, setCartShopId] = useState<string | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(true);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedItems = await AsyncStorage.getItem('cartItems');
        const storedShopId = await AsyncStorage.getItem('cartShopId');
        if (storedItems) setCartItems(JSON.parse(storedItems));
        if (storedShopId) setCartShopId(storedShopId);
      } catch (err) {
        console.error('Failed to load cart', err);
      } finally {
        setIsCartLoading(false);
      }
    };
    loadCart();
  }, []);

  // Save to AsyncStorage on change
  useEffect(() => {
    if (isCartLoading) return; // Don't save empty cart before loading
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('cartItems', JSON.stringify(cartItems));
        if (cartShopId) {
          await AsyncStorage.setItem('cartShopId', cartShopId);
        } else {
          await AsyncStorage.removeItem('cartShopId');
        }
      } catch (err) {
        console.error('Failed to save cart', err);
      }
    };
    saveCart();
  }, [cartItems, cartShopId, isCartLoading]);

  const addToCart = (product: any, shopId: string) => {
    // THE ZOMATO / BLINKIT RULE
    if (cartShopId && cartShopId !== shopId) {
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

  const overrideAndReplaceCart = (product: any, shopId: string) => {
    setCartShopId(shopId);
    setCartItems([{ productId: product._id, name: product.name, price: product.price, quantity: 1 }]);
    showToast("Previous cart cleared. New item added!");
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev => prev.map(item =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (productId: string) => {
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
    <CartContext.Provider value={{ cartItems, cartShopId, addToCart, overrideAndReplaceCart, updateQuantity, removeFromCart, clearCart, getTotal, isCartLoading }}>
      {children}
    </CartContext.Provider>
  );
};
