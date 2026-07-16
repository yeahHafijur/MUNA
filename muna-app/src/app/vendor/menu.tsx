import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Plus, Edit2, Trash2, Tag, Image as ImageIcon } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import api from '@/api/api';
import CategoryModal from '@/components/vendor/CategoryModal';
import ProductModal from '@/components/vendor/ProductModal';
import { getImageUrl } from '@/utils/format';

export default function VendorMenu() {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState<string | null>(null);

    // Modals
    const [catModal, setCatModal] = useState<any>(null); // 'add' | object
    const [catName, setCatName] = useState('');
    const [catImage, setCatImage] = useState<any>(null); // from picker
    const [catSaving, setCatSaving] = useState(false);

    const [prodModal, setProdModal] = useState<any>(null); // 'add' | object
    const [prodName, setProdName] = useState('');
    const [prodQuantity, setProdQuantity] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodCatId, setProdCatId] = useState('');
    const [prodImage, setProdImage] = useState<any>(null); // main image
    const [prodInStock, setProdInStock] = useState(true);
    const [prodSaving, setProdSaving] = useState(false);

    const { data: shop } = useQuery({
        queryKey: ['my-shop'],
        queryFn: async () => {
            const res = await api.get('/api/shops/my-shop');
            return res.data._id ? res.data : null;
        }
    });

    const { data: categories = [], refetch: refetchCategories } = useQuery({
        queryKey: ['vendor-categories', shop?._id],
        queryFn: async () => {
            if (!shop?._id) return [];
            const res = await api.get(`/api/categories/${shop._id}`);
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!shop?._id
    });

    const { data: products = [], refetch: refetchProducts, isLoading: isProductsLoading } = useQuery({
        queryKey: ['vendor-products', shop?._id],
        queryFn: async () => {
            if (!shop?._id) return [];
            const res = await api.get(`/api/products/${shop._id}`);
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!shop?._id
    });

    // --- CATEGORY ---
    const openAddCat = () => { setCatModal('add'); setCatName(''); setCatImage(null); };
    const openEditCat = (cat: any) => { setCatModal(cat); setCatName(cat.name); setCatImage(null); };

    const pickCatImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled) {
            setCatImage(result.assets[0]);
        }
    };

    const saveCat = async () => {
        if (!catName.trim()) return;
        setCatSaving(true);
        const isEdit = typeof catModal === 'object' && catModal._id;
        
        try {
            const formData = new FormData();
            formData.append('name', catName);
            if (catImage) {
                const localUri = catImage.uri;
                const filename = localUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;
                formData.append('image', { uri: localUri, name: filename, type } as any);
            }

            const url = isEdit ? `/api/categories/${catModal._id}` : '/api/categories';
            const method = isEdit ? 'put' : 'post';

            await api({ method, url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
            Alert.alert("Success", isEdit ? "Category updated" : "Category added");
            refetchCategories();
            setCatModal(null);
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to save category");
        } finally {
            setCatSaving(false);
        }
    };

    const deleteCat = (cat: any) => {
        Alert.alert("Delete Category", `Are you sure you want to delete "${cat.name}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        await api.delete(`/api/categories/${cat._id}`);
                        refetchCategories();
                        if (selectedCat === cat._id) setSelectedCat(null);
                        Alert.alert("Deleted", "Category deleted");
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete");
                    }
                }
            }
        ]);
    };

    // --- PRODUCT ---
    const openAddProd = () => {
        setProdModal('add'); setProdName(''); setProdQuantity(''); setProdPrice(''); setProdImage(null);
        setProdCatId(categories.length > 0 ? categories[0]._id : '');
        setProdInStock(true);
    };
    const openEditProd = (p: any) => {
        setProdModal(p); setProdName(p.name); setProdQuantity(p.quantity || ''); setProdPrice(p.price?.toString() || '');
        setProdCatId(typeof p.category === 'object' ? (p.category?._id || p.category) : p.category);
        setProdImage(null);
        setProdInStock(p.inStock !== false);
    };

    const pickProdImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.8,
        });
        if (!result.canceled) {
            setProdImage(result.assets[0]);
        }
    };

    const saveProd = async () => {
        if (!prodName.trim() || !prodPrice) {
            Alert.alert("Error", "Name and price are required");
            return;
        }
        setProdSaving(true);
        const isEdit = typeof prodModal === 'object' && prodModal._id;

        try {
            const formData = new FormData();
            formData.append('name', prodName);
            formData.append('quantity', prodQuantity);
            formData.append('price', prodPrice);
            formData.append('categoryId', prodCatId);
            formData.append('inStock', String(prodInStock));
            
            if (prodImage) {
                const localUri = prodImage.uri;
                const filename = localUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;
                formData.append('image', { uri: localUri, name: filename, type } as any);
            }

            const url = isEdit ? `/api/products/${prodModal._id}` : '/api/products';
            const method = isEdit ? 'put' : 'post';

            await api({ method, url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
            Alert.alert("Success", isEdit ? "Product updated" : "Product added");
            refetchProducts();
            setProdModal(null);
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to save product");
        } finally {
            setProdSaving(false);
        }
    };

    const deleteProd = (p: any) => {
        Alert.alert("Delete Product", `Are you sure you want to delete "${p.name}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        await api.delete(`/api/products/${p._id}`);
                        refetchProducts();
                        Alert.alert("Deleted", "Product deleted");
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete");
                    }
                }
            }
        ]);
    };

    const toggleStock = async (p: any) => {
        try {
            await api.put(`/api/products/${p._id}`, { inStock: !p.inStock });
            refetchProducts();
        } catch (error) {
            Alert.alert("Error", "Could not update stock");
        }
    };

    const getProductCatId = (p: any) => {
        if (!p || !p.category) return null;
        if (typeof p.category === 'object') {
            return p.category._id || p.category.id || null;
        }
        return p.category.toString();
    };
    
    const getCatName = (catId: string) => {
        const cat = categories.find((c: any) => c._id === catId);
        return cat ? cat.name : 'Uncategorized';
    };

    const filteredProducts = products.filter((p: any) => {
        if (selectedCat && getProductCatId(p) !== selectedCat) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    if (!shop) return null;

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            {/* Header */}
            <View className="bg-white pt-12 pb-3 px-4 shadow-sm border-b border-slate-100 flex-row items-center justify-between z-10">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.push('/vendor')} className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
                        <ArrowLeft size={20} color="#334155" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-extrabold text-slate-900 tracking-tight">Catalog & Menu</Text>
                </View>
                <TouchableOpacity onPress={openAddProd} className="bg-amber-400 px-4 py-2 rounded-xl shadow-sm">
                    <Text className="text-[12px] font-black text-amber-950 uppercase tracking-wider">+ Add Item</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-1">
                {/* Search */}
                <View className="px-4 py-3 bg-white border-b border-slate-100">
                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                        <Search size={18} color="#94a3b8" />
                        <TextInput 
                            className="flex-1 ml-2 text-[14px] font-bold text-slate-800"
                            placeholder="Search items..."
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* Categories Scroll */}
                <View className="bg-white px-4 py-3 border-b border-slate-100">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Categories</Text>
                        <TouchableOpacity onPress={openAddCat} className="bg-amber-50 px-2 py-0.5 rounded-md">
                            <Text className="text-[11px] font-black uppercase text-amber-600">+ Add</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
                        <TouchableOpacity
                            onPress={() => setSelectedCat(null)}
                            className={`px-4 py-2 rounded-xl border ${!selectedCat ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200 shadow-sm'}`}
                        >
                            <Text className={`text-[12px] font-black ${!selectedCat ? 'text-white' : 'text-slate-600'}`}>All Items</Text>
                        </TouchableOpacity>
                        {categories.map((cat: any) => (
                            <TouchableOpacity
                                key={cat._id}
                                onPress={() => setSelectedCat(cat._id)}
                                onLongPress={() => openEditCat(cat)}
                                className={`px-4 py-2 rounded-xl border flex-row items-center gap-2 ${selectedCat === cat._id ? 'bg-amber-400 border-amber-400' : 'bg-white border-slate-200 shadow-sm'}`}
                            >
                                <Text className={`text-[12px] font-black ${selectedCat === cat._id ? 'text-amber-950' : 'text-slate-600'}`}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <Text className="text-[9px] font-bold text-slate-400 mt-2">Long press category to edit</Text>
                </View>

                {/* Products Grid */}
                <FlatList 
                    className="flex-1 px-4 pt-4"
                    keyboardShouldPersistTaps="handled"
                    data={filteredProducts}
                    keyExtractor={(p: any) => p._id.toString()}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 8 }}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    ListEmptyComponent={
                        isProductsLoading ? (
                            <ActivityIndicator size="large" color="#fbbf24" className="mt-10" />
                        ) : (
                            <View className="items-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm mt-4">
                                <Text className="text-4xl mb-2">📦</Text>
                                <Text className="text-slate-500 font-bold text-sm">No items found.</Text>
                            </View>
                        )
                    }
                    renderItem={({ item: p }: { item: any }) => (
                        <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden w-[48%]">
                            <View className="h-32 bg-slate-50 p-2 items-center justify-center relative">
                                {p.image ? (
                                    <Image source={{ uri: getImageUrl(p.image) as string }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                                ) : (
                                    <Text className="text-3xl opacity-20">📷</Text>
                                )}
                                {!p.inStock && (
                                    <View className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                        <View className="bg-slate-900 px-2 py-1 rounded-md">
                                            <Text className="text-white text-[9px] font-black uppercase">Out of Stock</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                            <View className="p-3 border-t border-slate-50">
                                <Text className="text-[13px] font-black text-slate-900 line-clamp-2 mb-0.5" numberOfLines={2}>
                                    {p.name} {p.quantity ? `(${p.quantity})` : ''}
                                </Text>
                                <Text className="text-[10px] font-bold text-slate-400 mb-2" numberOfLines={1}>{getCatName(getProductCatId(p))}</Text>
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-[15px] font-black text-slate-900">₹{p.price}</Text>
                                    <TouchableOpacity 
                                        onPress={() => toggleStock(p)}
                                        className={`px-2 py-1 rounded-md border ${p.inStock ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'}`}
                                    >
                                        <Text className={`text-[9px] font-black uppercase tracking-widest ${p.inStock ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            {p.inStock ? 'In Stock' : 'Out'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row gap-1">
                                        <TouchableOpacity onPress={() => openEditProd(p)} className="w-8 h-8 bg-slate-50 items-center justify-center rounded-lg">
                                            <Edit2 size={14} color="#64748b" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteProd(p)} className="w-8 h-8 bg-rose-50 items-center justify-center rounded-lg">
                                            <Trash2 size={14} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                />
            </View>

            {/* Category Modal */}
            <CategoryModal 
                catModal={catModal}
                setCatModal={setCatModal}
                catName={catName}
                setCatName={setCatName}
                catImage={catImage}
                pickCatImage={pickCatImage}
                catSaving={catSaving}
                saveCat={saveCat}
                deleteCat={deleteCat}
            />

            {/* Product Modal */}
            <ProductModal 
                prodModal={prodModal}
                setProdModal={setProdModal}
                prodName={prodName}
                setProdName={setProdName}
                prodQuantity={prodQuantity}
                setProdQuantity={setProdQuantity}
                prodPrice={prodPrice}
                setProdPrice={setProdPrice}
                prodCatId={prodCatId}
                setProdCatId={setProdCatId}
                categories={categories}
                pickProdImage={pickProdImage}
                prodImage={prodImage}
                prodInStock={prodInStock}
                setProdInStock={setProdInStock}
                saveProd={saveProd}
                prodSaving={prodSaving}
            />
        </View>
    );
}
