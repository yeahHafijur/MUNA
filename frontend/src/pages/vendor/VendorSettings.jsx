import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { requestFirebaseNotificationPermission } from '../../firebase';

/* ─── Premium Crisp Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IconChevron = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const IconStore = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>;
const IconDelivery = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V11.625c0-.621-.504-1.125-1.125-1.125h-9.75a1.125 1.125 0 00-1.125 1.125v4.5m11.25 0v-4.5m0 0H21m-2.25-4.5h.008v.008h-.008V6.75z" /></svg>;
const IconBell = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const IconImage = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;

const SettingRow = ({ icon, title, subtitle, onClick, rightText, isDanger, badge, isLast }) => (
    <div
        onClick={() => {
            if (navigator.vibrate) navigator.vibrate(30);
            onClick();
        }}
        className={`flex items-center justify-between p-4 bg-white active:bg-slate-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-slate-50' : ''}`}
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-700'}`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className={`text-[14px] font-black tracking-tight ${isDanger ? 'text-rose-600' : 'text-slate-900'}`}>{title}</span>
                {subtitle && <span className="text-[12px] font-semibold text-slate-400 mt-0.5">{subtitle}</span>}
            </div>
        </div>
        <div className="flex items-center gap-2">
            {rightText && <span className="text-[11px] font-bold text-slate-400">{rightText}</span>}
            {badge && <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-wider">{badge}</span>}
            {!isDanger && <IconChevron />}
        </div>
    </div>
);

const VendorSettings = () => {
    // 🔥 Changed: Fetching Shop & Token Directly via useAuth
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);

    // Bottom Sheets State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [udyam, setUdyam] = useState('');
    const [minOrder, setMinOrder] = useState('');
    const [minimumCharge, setMinimumCharge] = useState('');
    const [chargePerKm, setChargePerKm] = useState('');
    const [maxDeliveryRange, setMaxDeliveryRange] = useState('');

    useEffect(() => {
        if (!token || user?.role !== 'vendor') { navigate('/'); return; }
        fetch('/api/shops/my-shop', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (data._id) setShop(data); });
    }, [token, user, navigate]);

    useEffect(() => {
        if (shop) {
            setUdyam(shop.udyamNumber || '');
            setMinOrder(shop.deliverySettings?.minOrderAmount || 0);
            setMinimumCharge(shop.deliverySettings?.minimumCharge || 0);
            setChargePerKm(shop.deliverySettings?.chargePerKm || 0);
            setMaxDeliveryRange(shop.deliverySettings?.maxRange || 5);
        }
    }, [shop]);

    const handleSave = async (e, type) => {
        e.preventDefault();
        setIsSaving(true);
        const loadingToast = toast.loading("Saving settings...");

        try {
            const body = {
                udyamNumber: udyam,
                deliverySettings: {
                    minOrderAmount: Number(minOrder),
                    minimumCharge: Number(minimumCharge),
                    chargePerKm: Number(chargePerKm),
                    maxRange: Number(maxDeliveryRange)
                }
            };

            const res = await fetch(`/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const updated = await res.json();
                setShop(updated);
                toast.update(loadingToast, { render: "Settings saved!", type: "success", isLoading: false, autoClose: 3000 });
                setIsProfileModalOpen(false);
                setIsDeliveryModalOpen(false);
            } else {
                toast.update(loadingToast, { render: "Failed to save settings", type: "error", isLoading: false, autoClose: 3000 });
            }
        } catch (error) {
            toast.update(loadingToast, { render: "Error saving settings", type: "error", isLoading: false, autoClose: 3000 });
        }
        setIsSaving(false);
    };

    const handleEnableNotifications = async () => {
        try {
            const fcmToken = await requestFirebaseNotificationPermission();
            if (fcmToken) {
                await fetch('/api/auth/fcm-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ fcmToken })
                });
                toast.success("Notifications enabled!");
            } else {
                toast.warning("Please allow notifications in browser settings.");
            }
        } catch (err) {
            toast.error("Failed to enable notifications.");
        }
    };

    if (!shop) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans">

            {/* ─── NATIVE HEADER ─── */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
                <button
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate('/vendor'); }}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                >
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Store Settings</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-24 space-y-6 max-w-3xl mx-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                <div>
                    <h3 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Store Details</h3>
                    <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <SettingRow
                            icon={<IconStore />}
                            title="Edit Store Profile"
                            subtitle="Udyam Number"
                            onClick={() => setIsProfileModalOpen(true)}
                        />
                        <SettingRow
                            icon={<IconImage />}
                            title="Banner Image"
                            subtitle="Managed via admin panel"
                            rightText="Contact Admin"
                            onClick={() => toast.info("Contact admin to change your store banner.")}
                            isLast={true}
                        />
                    </div>
                </div>

                <div>
                    <h3 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Delivery Configuration</h3>
                    <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <SettingRow
                            icon={<IconDelivery />}
                            title="Delivery Rules"
                            subtitle={`Max ${shop.deliverySettings?.maxRange || 5}km • Min ₹${shop.deliverySettings?.minOrderAmount || 0}`}
                            onClick={() => setIsDeliveryModalOpen(true)}
                            isLast={true}
                        />
                    </div>
                </div>

                <div>
                    <h3 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">App Settings</h3>
                    <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <SettingRow
                            icon={<IconBell />}
                            title="Notifications"
                            subtitle="New order alerts"
                            badge={Notification.permission === 'granted' ? 'Enabled' : 'Off'}
                            onClick={handleEnableNotifications}
                            isLast={true}
                        />
                    </div>
                </div>
            </div>

            {/* ─── FLOATING BOTTOM SHEET: STORE PROFILE ─── */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 ease-out" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Store Profile</h3>
                            <button onClick={() => setIsProfileModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-95 transition-transform">✕</button>
                        </div>
                        <form onSubmit={(e) => handleSave(e, 'profile')} className="space-y-5">
                            <div className="relative">
                                <input type="text" value={shop.name} disabled className="peer w-full pt-6 pb-2 px-4 bg-slate-100 border-2 border-transparent rounded-2xl text-slate-400 font-bold focus:outline-none transition-all placeholder-transparent cursor-not-allowed" placeholder="Store Name" />
                                <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest -translate-y-2 text-sm normal-case">Store Name (Contact Admin to change)</label>
                            </div>
                            <div className="relative">
                                <input type="text" value={udyam} onChange={(e) => setUdyam(e.target.value)} className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Udyam Number" />
                                <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Udyam Number (Optional)</label>
                            </div>
                            <button type="submit" disabled={isSaving} className="w-full mt-2 p-4 bg-amber-400 text-slate-900 rounded-2xl font-black text-[15px] active:scale-[0.98] transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.3)] disabled:opacity-70">
                                {isSaving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── FLOATING BOTTOM SHEET: DELIVERY RULES ─── */}
            {isDeliveryModalOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 ease-out" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0"></div>
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Delivery Rules</h3>
                            <button onClick={() => setIsDeliveryModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-95 transition-transform">✕</button>
                        </div>
                        <form onSubmit={(e) => handleSave(e, 'delivery')} className="space-y-5">

                            <div className="relative">
                                <input type="number" required value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Min Order" />
                                <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Minimum Order Amount (₹)</label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <input type="number" required value={minimumCharge} onChange={(e) => setMinimumCharge(e.target.value)} className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Base Charge" />
                                    <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Base Charge (₹)</label>
                                </div>
                                <div className="relative">
                                    <input type="number" required value={chargePerKm} onChange={(e) => setChargePerKm(e.target.value)} className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Per KM" />
                                    <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Charge Per KM (₹)</label>
                                </div>
                            </div>

                            <div className="relative">
                                <input type="number" required value={maxDeliveryRange} onChange={(e) => setMaxDeliveryRange(e.target.value)} className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Max Range" />
                                <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Max Delivery Range (KM)</label>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full mt-2 p-4 bg-amber-400 text-slate-900 rounded-2xl font-black text-[15px] active:scale-[0.98] transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.3)] disabled:opacity-70">
                                {isSaving ? 'Saving...' : 'Save Rules'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorSettings;