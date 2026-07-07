import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const IconBack = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const inputClasses = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all";
const labelClasses = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";

const VendorRequestForm = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    
    const [formData, setFormData] = useState({
        name: user?.name || '',
        shopName: '',
        phone: user?.phone || '',
        address: ''
    });
    const [loading, setLoading] = useState(false);

    if (!user) {
        return (
            <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
                <div className="text-lg font-bold text-slate-800">Please login first</div>
                <button onClick={() => navigate('/login')} className="mt-4 px-6 py-3 bg-amber-400 font-bold rounded-xl text-slate-900">Go to Login</button>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/vendor-requests', { credentials: 'include', 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Request submitted successfully!");
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
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
            <div className="bg-white px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-slate-100">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform">
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Become a Vendor</span>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="max-w-md mx-auto w-full">
                    <div className="text-center mb-8 mt-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🏪</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Join as a Vendor</h2>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">Fill out this quick form and our team will contact you shortly to set up your shop!</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <div>
                            <label className={labelClasses}>Your Full Name</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClasses} placeholder="John Doe" />
                        </div>
                        
                        <div>
                            <label className={labelClasses}>Proposed Shop Name</label>
                            <input type="text" name="shopName" required value={formData.shopName} onChange={handleChange} className={inputClasses} placeholder="Maa Store" />
                        </div>
                        
                        <div>
                            <label className={labelClasses}>Contact Number</label>
                            <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className={inputClasses} placeholder="+91 XXXXX XXXXX" />
                        </div>
                        
                        <div>
                            <label className={labelClasses}>Shop Address</label>
                            <textarea name="address" required value={formData.address} onChange={handleChange} rows="3" className={`${inputClasses} resize-none`} placeholder="Full address of your shop" />
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-3.5 bg-amber-400 text-slate-900 rounded-xl font-bold text-base shadow-[0_4px_14px_rgba(251,191,36,0.3)] hover:bg-amber-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VendorRequestForm;
