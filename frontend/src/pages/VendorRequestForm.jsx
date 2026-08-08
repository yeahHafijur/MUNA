import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import PageHeader from '../components/ui/PageHeader';

const IcoUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IcoMail = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const IcoPhone = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.051l-3.21-.535a1.125 1.125 0 00-1.282.72l-1.22 3.658A18.006 18.006 0 013.6 9.605l3.658-1.22a1.125 1.125 0 00.72-1.282l-.535-3.21C7.437 3.38 6.987 3 6.47 3H5.172a2.25 2.25 0 00-2.25 2.25v1.5z" /></svg>;
const IcoStore = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>;
const IcoMapPin = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const IcoClock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IcoUpload = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>;

const inputWrapper = "bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 h-12 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all overflow-hidden";
const inputClasses = "flex-1 text-[15px] font-medium text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400";
const labelClasses = "block text-[12px] font-bold text-slate-500 mb-1.5 ml-1";

const VendorRequestForm = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        vendorEmail: user?.email || '',
        phone: user?.phone || '',
        shopName: '',
        address: '',
        udyamNumber: '',
        openTime: '09:00',
        closeTime: '21:00'
    });
    
    const [shopLat, setShopLat] = useState('');
    const [shopLng, setShopLng] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch categories
        fetch('/api/shop-categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error(err));
            
        // Try to get location silently
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setShopLat(pos.coords.latitude);
                setShopLng(pos.coords.longitude);
            }, () => {}, { timeout: 10000 });
        }
    }, []);

    if (!user) {
        return (
            <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
                <div className="text-lg font-bold text-slate-800">Please login first</div>
                <button onClick={() => navigate('/login')} className="mt-4 px-6 py-3 bg-emerald-600 font-bold rounded-xl text-white">Go to Login</button>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.vendorEmail.trim() || !formData.phone.trim()) {
            toast.error("Please fill in all owner details.");
            return;
        }
        if (!formData.shopName.trim() || !formData.address.trim() || !selectedCategory) {
            toast.error("Please provide Shop Name, Address, and select a Category.");
            return;
        }
        if (formData.phone.trim().length < 10) {
            toast.error("Please enter a valid phone number.");
            return;
        }

        setLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name.trim());
            submitData.append('vendorEmail', formData.vendorEmail.trim());
            submitData.append('phone', formData.phone.trim());
            submitData.append('shopName', formData.shopName.trim());
            submitData.append('address', formData.address.trim());
            submitData.append('shopCategoryId', selectedCategory._id);
            submitData.append('shopCategory', selectedCategory.name);
            submitData.append('udyamNumber', formData.udyamNumber.trim());
            submitData.append('openTime', formData.openTime);
            submitData.append('closeTime', formData.closeTime);
            
            if (shopLat && shopLng) {
                submitData.append('shopLat', shopLat);
                submitData.append('shopLng', shopLng);
            }
            if (image) {
                submitData.append('image', image);
            }

            const res = await fetch('/api/vendor-requests', { 
                credentials: 'include', 
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: submitData
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Request submitted! Our team will contact you shortly.", { autoClose: 5000 });
                navigate('/profile', { replace: true });
            } else {
                toast.error(data.message || "Failed to submit request");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans overflow-hidden">
            <PageHeader title="Become a Vendor" variant="white" sticky={true} />

            <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="max-w-md mx-auto w-full">
                    
                    {/* Hero Section */}
                    <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 mb-6 flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3 text-emerald-600">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
                        </div>
                        <h2 className="text-[18px] font-black text-emerald-900 mb-2">Sell on MUNA</h2>
                        <p className="text-[13px] font-medium text-emerald-700 text-center leading-relaxed">Provide your details below. We'll set up your shop for you!</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Owner Details */}
                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-5">
                            <h3 className="text-[15px] font-black text-slate-900 mb-5">Owner Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Full Name *</label>
                                    <div className={inputWrapper}>
                                        <div className="text-slate-400 mr-2"><IcoUser /></div>
                                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClasses} placeholder="Your full name" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Email Address *</label>
                                    <div className={inputWrapper}>
                                        <div className="text-slate-400 mr-2"><IcoMail /></div>
                                        <input type="email" name="vendorEmail" required value={formData.vendorEmail} onChange={handleChange} className={inputClasses} placeholder="name@gmail.com" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Phone Number *</label>
                                    <div className={inputWrapper}>
                                        <div className="text-slate-400 mr-2"><IcoPhone /></div>
                                        <input type="tel" name="phone" required maxLength={10} value={formData.phone} onChange={handleChange} className={inputClasses} placeholder="10-digit mobile number" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shop Details */}
                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-8">
                            <h3 className="text-[15px] font-black text-slate-900 mb-5">Shop Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Shop Name *</label>
                                    <div className={inputWrapper}>
                                        <div className="text-slate-400 mr-2"><IcoStore /></div>
                                        <input type="text" name="shopName" required value={formData.shopName} onChange={handleChange} className={inputClasses} placeholder="E.g. Sharma Kirana Store" />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClasses}>Shop Category *</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        {categories.map(cat => (
                                            <button 
                                                type="button"
                                                key={cat._id}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`px-4 py-2 rounded-full whitespace-nowrap border transition-colors ${
                                                    selectedCategory?._id === cat._id 
                                                    ? 'bg-amber-100 border-amber-400 text-amber-700' 
                                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                                }`}
                                            >
                                                <span className="text-[13px] font-bold">{cat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClasses}>Shop Address *</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl flex px-4 py-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                                        <div className="text-slate-400 mr-2 mt-0.5"><IcoMapPin /></div>
                                        <textarea name="address" required value={formData.address} onChange={handleChange} rows="3" className={`${inputClasses} resize-none`} placeholder="Complete shop address" />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className={labelClasses}>Opening Time</label>
                                        <div className={inputWrapper}>
                                            <div className="text-slate-400 mr-2"><IcoClock /></div>
                                            <input type="time" name="openTime" value={formData.openTime} onChange={handleChange} className={inputClasses} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className={labelClasses}>Closing Time</label>
                                        <div className={inputWrapper}>
                                            <div className="text-slate-400 mr-2"><IcoClock /></div>
                                            <input type="time" name="closeTime" value={formData.closeTime} onChange={handleChange} className={inputClasses} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClasses}>Udyam Number (Optional)</label>
                                    <div className={inputWrapper}>
                                        <input type="text" name="udyamNumber" value={formData.udyamNumber} onChange={handleChange} className={inputClasses} placeholder="E.g. UDYAM-XX-00-0000000" />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClasses}>Shop Photo (Optional)</label>
                                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} className="hidden" />
                                    <div 
                                        onClick={() => fileInputRef.current.click()}
                                        className="bg-slate-50 border-2 border-dashed border-emerald-200 rounded-xl p-6 flex flex-col items-center justify-center overflow-hidden min-h-[140px] cursor-pointer hover:bg-emerald-50/50 transition-colors relative"
                                    >
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Shop Preview" className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <span className="text-white font-bold text-[13px]">Change Photo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-emerald-500 mb-2"><IcoUpload /></div>
                                                <span className="text-[13px] font-bold text-slate-600 mb-1">Tap to upload a photo</span>
                                                <span className="text-[11px] font-medium text-slate-400">Clear photo helps customers find you</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className={`w-full h-14 rounded-xl flex items-center justify-center shadow-sm transition-all ${loading ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'} disabled:opacity-70`}
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="text-white font-black text-[15px]">Submit Request</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VendorRequestForm;
