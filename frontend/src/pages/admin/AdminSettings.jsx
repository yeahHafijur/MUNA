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

const AdminSettings = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [navbarMsg, setNavbarMsg] = useState({ line1: '', line2: '' });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        if (!token || user?.role !== 'super_admin') navigate('/');
    }, [token, user, navigate]);

    const { data: settings } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => {
            const res = await fetch('/api/settings/navbar-message');
            const data = await res.json();
            return res.ok ? data : { line1: '', line2: '' };
        }
    });

    useEffect(() => {
        if (settings) {
            setNavbarMsg({ line1: settings.line1 || '', line2: settings.line2 || '' });
        }
    }, [settings]);

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        const loadingToast = toast.loading("Saving settings...");
        try {
            const res = await fetch('/api/settings/navbar-message', {
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

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-xl mx-auto w-full">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-base font-black text-gray-900 tracking-tight">App Settings</h2>
                    </div>
                    <form onSubmit={handleSettingsSubmit} className="p-6 space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">Dynamic Navbar Message</h3>
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
            </div>
        </div>
    );
};

export default AdminSettings;
