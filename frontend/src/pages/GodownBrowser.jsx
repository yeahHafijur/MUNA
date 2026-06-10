import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './GodownBrowser.css';

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
        fetch('/api/master-products?status=approved')
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
        <div className="godownbrowser-style-1 fade-in animate-in">
            <div className="godownbrowser-style-2">
                <div>
                    <h1 className="godownbrowser-style-3">Master Godown 📦</h1>
                    <p className="godownbrowser-style-4">Select items to instantly add to your shop menu</p>
                </div>
                <Link to="/vendor-dashboard" className="godownbrowser-style-5">
                    Back to Dashboard
                </Link>
            </div>

            {/* Search Bar */}
            <div className="godownbrowser-style-6">
                <div className="godownbrowser-style-7">
                    <span className="godownbrowser-style-8">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search for any item in Godown (e.g. Rice, Milk, Biscuit)..." 
                        className="godownbrowser-style-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Category Groups */}
            <div className="godownbrowser-style-10">
                {Object.keys(groupedItems).length === 0 ? (
                    <div className="godownbrowser-style-11">
                        <span className="godownbrowser-style-12">👀</span>
                        <h3 className="godownbrowser-style-13">No items found</h3>
                        <p className="godownbrowser-style-14">You can create custom items directly from the Vendor Dashboard.</p>
                    </div>
                ) : (
                    Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category} className="godownbrowser-style-15">
                            {/* Category Header (Not sticky to prevent overlap) */}
                            <div className="godownbrowser-style-16">
                                <h2 className="godownbrowser-style-17">{category}</h2>
                                <span className="godownbrowser-style-18">{items.length} items</span>
                            </div>
                            
                            {/* Items Grid with better spacing */}
                            <div className="godownbrowser-style-19">
                                {items.map((item) => (
                                    <div 
                                        key={item._id} 
                                        className="godownbrowser-style-20 group"
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div className="godownbrowser-style-21 group">
                                            {item.image ? <img src={item.image} className="godownbrowser-style-22" /> : "📦"}
                                        </div>
                                        <h3 className="godownbrowser-style-23">{item.name}</h3>
                                        <button className="godownbrowser-style-24 group">
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
                <div className="godownbrowser-style-25">
                    <div className="godownbrowser-style-26">
                        <div className="godownbrowser-style-27">
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="godownbrowser-style-28"
                            >
                                ✕
                            </button>
                            <div className="godownbrowser-style-29">
                                {selectedItem.image ? <img src={selectedItem.image} className="godownbrowser-style-30" /> : "📦"}
                            </div>
                            <h2 className="godownbrowser-style-31">{selectedItem.name}</h2>
                            <p className="godownbrowser-style-32">{selectedItem.category}</p>
                        </div>
                        
                        <form onSubmit={handleAddToShop} className="godownbrowser-style-33">
                            <label className="godownbrowser-style-34">
                                Aap kitne me bechenge? (₹)
                            </label>
                            <input 
                                type="number" 
                                required
                                autoFocus
                                placeholder="e.g. 50"
                                className="godownbrowser-style-35"
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                            />
                            
                            <button 
                                type="submit" 
                                className="godownbrowser-style-36"
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



