import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { optimizeImage } from '../../utils/imageUtils';

/* ─── Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;

/* ─── Shared Styles ─── */
const inputClasses = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all";
const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";
const btnPrimaryClasses = "px-6 py-2.5 bg-amber-400 text-gray-900 rounded-lg text-sm font-bold active:scale-95 transition-transform shadow-sm hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed";

const AdminSettings = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [navbarMsg, setNavbarMsg] = useState({ line1: '', line2: '' });
    const [savingSettings, setSavingSettings] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [savingFeatured, setSavingFeatured] = useState(false);

    useEffect(() => {
        if (user?.role !== 'super_admin') navigate('/');
    }, [token, user, navigate]);

    const { data: settings } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => {
            const res = await fetch('/api/settings/navbar-message', { credentials: 'include' });
            const data = await res.json();
            return res.ok ? data : { line1: '', line2: '' };
        }
    });

    // Fetch all godown items (with images)
    const { data: allGodownItems = [] } = useQuery({
        queryKey: ['godown-all-items'],
        queryFn: () => fetch('/api/master-products', { credentials: 'include' }).then(r => r.json()),
        select: (data) => (Array.isArray(data) ? data : []).filter(item => item.image),
    });

    // Fetch currently featured item IDs
    const { data: featuredItems = [] } = useQuery({
        queryKey: ['featured-items-admin'],
        queryFn: () => fetch('/api/settings/featured-items', { credentials: 'include' }).then(r => r.json()),
    });

    useEffect(() => {
        if (settings) {
            setNavbarMsg({ line1: settings.line1 || '', line2: settings.line2 || '' });
        }
    }, [settings]);

    useEffect(() => {
        if (featuredItems.length > 0) {
            setSelectedItemIds(featuredItems.map(item => item._id));
        }
    }, [featuredItems]);

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        const loadingToast = toast.loading("Saving settings...");
        try {
            const res = await fetch('/api/settings/navbar-message', { credentials: 'include', 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(navbarMsg)
            });
            const data = await res.json();
            if (res.ok) toast.success("Navbar message updated successfully!");
            else toast.error(data.message || 'Failed to update settings');
        } catch (err) { toast.error("Error updating settings."); }
        finally { toast.dismiss(loadingToast); setSavingSettings(false); }
    };

    const toggleItem = (itemId) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSaveFeatured = async () => {
        setSavingFeatured(true);
        const loadingToast = toast.loading("Saving featured items...");
        try {
            const res = await fetch('/api/settings/featured-items', { credentials: 'include', 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ itemIds: selectedItemIds })
            });
            if (res.ok) {
                toast.success("Featured items updated!");
                queryClient.invalidateQueries({ queryKey: ['featured-items-admin'] });
                queryClient.invalidateQueries({ queryKey: ['featured-carousel'] });
            } else {
                toast.error("Failed to update featured items.");
            }
        } catch (err) { toast.error("Error saving featured items."); }
        finally { toast.dismiss(loadingToast); setSavingFeatured(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans">

            {/* ─── NATIVE HEADER ─── */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
                <button
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate('/admin'); }}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                >
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">App Settings</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-7xl mx-auto w-full space-y-6">

                {/* ─── Navbar Message Section ─── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-base font-black text-gray-900 tracking-tight">Dynamic Navbar Message</h2>
                    </div>
                    <form onSubmit={handleSettingsSubmit} className="p-6 space-y-6">
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-4">This message appears at the top of the home screen for all users.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Line 1</label>
                                    <input type="text" required placeholder="e.g. Your local market," className={inputClasses} value={navbarMsg.line1} onChange={(e) => setNavbarMsg({ ...navbarMsg, line1: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Line 2</label>
                                    <input type="text" required placeholder="e.g. delivered in minutes ⚡" className={inputClasses} value={navbarMsg.line2} onChange={(e) => setNavbarMsg({ ...navbarMsg, line2: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                            <button type="submit" disabled={savingSettings} className={`${btnPrimaryClasses} w-full py-3`}>
                                {savingSettings ? 'Saving...' : 'Update Message'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ─── Featured Items Section ─── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black text-gray-900 tracking-tight">Homepage Carousel Items</h2>
                            <p className="text-[11px] font-medium text-gray-400 mt-0.5">Select godown items to show on homepage</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                            {selectedItemIds.length} selected
                        </span>
                    </div>
                    <div className="p-4">
                        {allGodownItems.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 font-medium py-8">No godown items with images available.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {allGodownItems.map(item => {
                                    const isSelected = selectedItemIds.includes(item._id);
                                    return (
                                        <button
                                            key={item._id}
                                            onClick={() => toggleItem(item._id)}
                                            className={`relative rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                                                isSelected
                                                    ? 'border-amber-400 shadow-lg shadow-amber-400/20 ring-2 ring-amber-400/30'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="aspect-square w-full">
                                                <img src={optimizeImage(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-2">
                                                <div className="text-[11px] font-bold text-white truncate">{item.name}</div>
                                                {item.price > 0 && <div className="text-[10px] font-bold text-amber-300">₹{item.price}</div>}
                                            </div>
                                            {/* Selection indicator */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-3.5 h-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                </div>
                                            )}
                                            {!isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/30 border-2 border-white/50" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={handleSaveFeatured}
                                disabled={savingFeatured}
                                className={`${btnPrimaryClasses} w-full py-3`}
                            >
                                {savingFeatured ? 'Saving...' : `Save Featured Items (${selectedItemIds.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
