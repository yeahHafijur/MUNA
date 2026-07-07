import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

/* ─── Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;

/* ─── Shared Styles ─── */
const inputClasses = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all";
const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";
const btnPrimaryClasses = "px-6 py-2.5 bg-amber-400 text-gray-900 rounded-lg text-sm font-bold active:scale-95 transition-transform shadow-sm hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed";

const AdminOnboard = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        vendorName: '', vendorEmail: '', vendorPhone: '',
        shopName: '', shopAddress: '', shopCategory: '', shopCategoryId: '', udyamNumber: '', shopLat: '', shopLng: '',
        openTime: '09:00', closeTime: '21:00'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user?.role !== 'super_admin') navigate('/');
    }, [token, user, navigate]);

    // Fetch shop categories for dropdown
    const { data: shopCategories = [] } = useQuery({
        queryKey: ['shop-categories'],
        queryFn: async () => {
            const res = await fetch('/api/shop-categories', { credentials: 'include' });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const loadingToast = toast.loading("Creating vendor...");
        try {
            const res = await fetch('/api/admin/onboard', { credentials: 'include', 
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error onboarding vendor');
            toast.success(data.message || "Vendor created successfully!");
            setFormData({ vendorName: '', vendorEmail: '', vendorPhone: '', shopName: '', shopAddress: '', shopCategory: '', shopCategoryId: '', udyamNumber: '', shopLat: '', shopLng: '', openTime: '09:00', closeTime: '21:00' });
        } catch (error) { toast.error(error.message); }
        finally { toast.dismiss(loadingToast); setIsSubmitting(false); }
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
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Onboard Vendor</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-7xl mx-auto w-full">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-base font-black text-gray-900 tracking-tight">Register New Vendor</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-8">

                        {/* Vendor Details */}
                        <div>
                            <h3 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                <span className="w-1.5 h-4 bg-amber-400 rounded-full"></span> Vendor Details
                            </h3>
                            <div className="space-y-4">
                                <input type="text" name="vendorName" required placeholder="Full name" className={inputClasses} value={formData.vendorName} onChange={handleChange} />
                                <input type="email" name="vendorEmail" required placeholder="Google email" className={inputClasses} value={formData.vendorEmail} onChange={handleChange} />
                                <input type="tel" name="vendorPhone" required placeholder="Phone (10 digits)" className={inputClasses} value={formData.vendorPhone} onChange={handleChange} minLength="10" maxLength="10" />
                            </div>
                        </div>

                        {/* Shop Details */}
                        <div>
                            <h3 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                <span className="w-1.5 h-4 bg-amber-400 rounded-full"></span> Shop Details
                            </h3>
                            <div className="space-y-4">
                                <input type="text" name="shopName" required placeholder="Shop name" className={inputClasses} value={formData.shopName} onChange={handleChange} />
                                <input type="text" name="shopAddress" required placeholder="Full address" className={inputClasses} value={formData.shopAddress} onChange={handleChange} />
                                <select name="shopCategoryId" className={inputClasses} value={formData.shopCategoryId} onChange={(e) => {
                                    const selected = shopCategories.find(c => c._id === e.target.value);
                                    setFormData({ ...formData, shopCategoryId: e.target.value, shopCategory: selected?.name || 'General' });
                                }}>
                                    <option value="">Select Shop Category</option>
                                    {shopCategories.map(sc => <option key={sc._id} value={sc._id}>{sc.name}</option>)}
                                </select>
                                <input type="text" name="udyamNumber" placeholder="Udyam number (optional)" className={`${inputClasses} font-mono`} value={formData.udyamNumber} onChange={handleChange} />

                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" step="any" name="shopLat" required placeholder="Latitude" className={inputClasses} value={formData.shopLat} onChange={handleChange} />
                                    <input type="number" step="any" name="shopLng" required placeholder="Longitude" className={inputClasses} value={formData.shopLng} onChange={handleChange} />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className={labelClasses}>Open Time</label>
                                        <input type="time" name="openTime" required className={inputClasses} value={formData.openTime} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Close Time</label>
                                        <input type="time" name="closeTime" required className={inputClasses} value={formData.closeTime} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button type="submit" disabled={isSubmitting} className={`${btnPrimaryClasses} w-full py-4 text-base`}>
                                {isSubmitting ? 'Creating...' : 'Create Vendor & Shop'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminOnboard;
