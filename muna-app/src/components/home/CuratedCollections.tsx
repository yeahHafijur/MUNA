import React, { useMemo } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import ProductCard from '../ProductCard';
import { useCart } from '@/context/CartContext';

interface CuratedCollectionsProps {
    featuredProducts: any[];
}

const collections = [
    {
        title: "Breakfast Essentials 🍳",
        subtitle: "Start your day right",
        keywords: ['milk', 'bread', 'egg', 'butter', 'poha', 'oats', 'tea', 'coffee'],
        bgColor: 'bg-orange-50'
    },
    {
        title: "Snacks & Munchies 🍿",
        subtitle: "For your cravings",
        keywords: ['chips', 'namkeen', 'biscuit', 'maggi', 'noodles', 'chocolate', 'kurkure'],
        bgColor: 'bg-purple-50'
    },
    {
        title: "Cold Drinks & Juices 🥤",
        subtitle: "Stay refreshed",
        keywords: ['coke', 'pepsi', 'sprite', 'juice', 'maaza', 'frooti', 'water', 'soda'],
        bgColor: 'bg-blue-50'
    }
];

export default function CuratedCollections({ featuredProducts }: CuratedCollectionsProps) {
    const router = useRouter();
    const { cartItems, addToCart, overrideAndReplaceCart, updateQuantity, removeFromCart } = useCart();

    const handleAddToCart = (product: any, shopId: string) => {
        const result = addToCart(product, shopId);
        if (!result.success && result.error === 'DIFFERENT_SHOP_ERROR') {
            Alert.alert(
                'Replace cart item?',
                'Your cart contains items from another shop. Do you want to discard the selection and add items from this shop?',
                [
                    { text: 'No', style: 'cancel' },
                    { text: 'Replace', onPress: () => overrideAndReplaceCart(product, shopId) }
                ]
            );
        }
    };

    const renderCollection = (collection: any, idx: number) => {
        // Filter products that match any keyword in name or category
        const matchedProducts = featuredProducts.filter(prod => {
            const name = prod.name?.toLowerCase() || '';
            const cat = prod.category?.name?.toLowerCase() || (typeof prod.category === 'string' ? prod.category.toLowerCase() : '');
            return collection.keywords.some((kw: string) => name.includes(kw) || cat.includes(kw));
        }).slice(0, 5); // Take top 5

        if (matchedProducts.length === 0) return null;

        return (
            <View key={idx} className={`mb-6 py-5 ${collection.bgColor} border-y border-slate-100/50`}>
                <View className="px-4 mb-3">
                    <Text className="text-[18px] font-black text-slate-900">{collection.title}</Text>
                    <Text className="text-[12px] font-medium text-slate-600 mt-0.5">{collection.subtitle}</Text>
                </View>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 12, gap: 12 }}
                >
                    {matchedProducts.map(prod => {
                        const cartItem = cartItems.find((item: any) => item.productId === prod._id);
                        const quantity = cartItem ? cartItem.quantity : 0;
                        const shopId = prod.shopId?._id || prod.shopId;
                        
                        return (
                            <View key={prod._id} className="w-[140px]">
                                <ProductCard 
                                    product={prod}
                                    quantity={quantity}
                                    onIncrement={() => updateQuantity(prod._id, quantity + 1)}
                                    onDecrement={() => {
                                        if (quantity === 1) {
                                            removeFromCart(prod._id);
                                        } else {
                                            updateQuantity(prod._id, quantity - 1);
                                        }
                                    }}
                                    onClick={() => router.push(`/product/${shopId}/${prod._id}` as any)}
                                    onAddClick={() => handleAddToCart(prod, shopId)}
                                />
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    return (
        <View className="mt-2">
            {collections.map((coll, idx) => renderCollection(coll, idx))}
        </View>
    );
}
