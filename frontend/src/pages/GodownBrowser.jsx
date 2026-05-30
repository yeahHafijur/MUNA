import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const GodownBrowser = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [godownItems, setGodownItems] = useState([]);
    const [shop, setShop] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // For pricing modal
    const [selectedItem, setSelectedItem] = useState(null);
    const [customPrice, setCustomPrice] = useState('');

    useEffect(() => {
        if (!token || user?.role !== 'vendor') {
            navigate('/');
            return;
        }

        // Vendor ki dukan lao
        fetch('/api/shops/my-shop', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(shopData => setShop(shopData));

        // Godown items lao
        fetch('/api/master-products')
            .then(res => res.json())
            .then(data => setGodownItems(Array.isArray(data) ? data : []));
    }, [token, user, navigate]);

    const handleAddToShop = async (e) => {
        e.preventDefault();
        if (!selectedItem || !customPrice) return;

        const formData = new FormData();
        formData.append('name', selectedItem.name);
        formData.append('price', Number(customPrice));
        formData.append('category', selectedItem.category);
        if (selectedItem.image) {
            formData.append('image', selectedItem.image); // String URL
        }

        await fetch('/api/products', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        // Close modal and show success (can just alert for now or reset)
        setSelectedItem(null);
        setCustomPrice('');
        alert(`${selectedItem.name} added to your shop!`);
    };

    // Grouping by category
    const filteredItems = godownItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <div className="pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Master Godown 📦</h1>
                    <p className="text-gray-500 text-sm">Select items to instantly add to your shop menu</p>
                </div>
                <Link to="/vendor-dashboard" className="text-sm font-bold text-gray-600 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                    Back to Dashboard
                </Link>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-8 sticky top-[68px] z-30">
                <div className="relative w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search for any item in Godown (e.g. Rice, Milk, Biscuit)..." 
                        className="w-full border-2 border-gray-100 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50 transition-all font-bold text-gray-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Category Groups */}
            <div className="space-y-8">
                {Object.keys(groupedItems).length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                        <span className="text-5xl mb-4 block">👀</span>
                        <h3 className="text-lg font-bold text-gray-800">No items found</h3>
                        <p className="text-gray-500">You can create custom items directly from the Vendor Dashboard.</p>
                    </div>
                ) : (
                    Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category} className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            {/* Category Header (Not sticky to prevent overlap) */}
                            <div className="bg-[#f8cb46] px-6 py-4 flex justify-between items-center">
                                <h2 className="font-black text-gray-900 uppercase tracking-wider text-lg">{category}</h2>
                                <span className="bg-white/30 text-gray-900 px-3 py-1 rounded-full text-xs font-bold border border-black/10 shadow-sm">{items.length} items</span>
                            </div>
                            
                            {/* Items Grid with better spacing */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 sm:p-6">
                                {items.map((item) => (
                                    <div 
                                        key={item._id} 
                                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all group"
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div className="w-20 h-20 bg-gray-50 rounded-xl shadow-sm border border-gray-100 mb-3 flex items-center justify-center text-4xl overflow-hidden group-hover:scale-110 transition-transform duration-300">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : "📦"}
                                        </div>
                                        <h3 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight mb-2">{item.name}</h3>
                                        <button className="mt-auto text-xs font-black text-yellow-700 bg-yellow-100/80 px-4 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-yellow-200">
                                            + ADD ITEM
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pricing Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-yellow-400 p-5 text-center relative">
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-3 right-3 text-yellow-900 bg-yellow-300/50 hover:bg-yellow-300 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                            >
                                ✕
                            </button>
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-md mx-auto mb-3 flex items-center justify-center text-4xl overflow-hidden border-2 border-white">
                                {selectedItem.image ? <img src={selectedItem.image} className="w-full h-full object-cover" /> : "📦"}
                            </div>
                            <h2 className="text-xl font-black text-gray-900">{selectedItem.name}</h2>
                            <p className="text-xs font-bold text-yellow-900 uppercase tracking-widest">{selectedItem.category}</p>
                        </div>
                        
                        <form onSubmit={handleAddToShop} className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Aap kitne me bechenge? (₹)
                            </label>
                            <input 
                                type="number" 
                                required
                                autoFocus
                                placeholder="e.g. 50"
                                className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-yellow-400 text-lg font-bold mb-4"
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                            />
                            
                            <button 
                                type="submit" 
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl shadow-md transition-colors"
                            >
                                ADD TO SHOP MENU
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GodownBrowser;
