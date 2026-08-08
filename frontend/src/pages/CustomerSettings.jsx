import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { requestFirebaseNotificationPermission } from '../firebase';
import { toast } from 'react-toastify';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

/* ─── Premium Crisp Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IconChevron = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const IconUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IconMapPin = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const IconBell = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const IconShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;

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

const CustomerSettings = () => {
    const { user, token, logout, login } = useAuth();
    const navigate = useNavigate();

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isAddressesModalOpen, setIsAddressesModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
    const [newAddressType, setNewAddressType] = useState('Home');
    const [newAddressText, setNewAddressText] = useState('');
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    const handleDeleteAccount = () => {
        setIsDeleteModalOpen(true);
        setDeleteConfirmText('');
    };

    const confirmDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") {
            toast.error("Type DELETE to confirm");
            return;
        }

        try {
            const res = await fetch('/api/auth/delete-account', { credentials: 'include', 
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Account deleted.");
                logout();
                navigate('/');
            } else {
                toast.error("Failed to delete account");
            }
        } catch (error) {
            toast.error("Error deleting account");
        }
    };

    const handleDeleteLocation = async (id) => {
        if (!window.confirm("Delete this saved location?")) return;
        try {
            const res = await fetch(`/api/auth/delete-location/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                login({ ...user, savedLocations: data.savedLocations }, token);
                toast.success("Location deleted");
            }
        } catch (error) { toast.error("Error deleting location"); }
    };

    const handleSaveNewAddress = async () => {
        if (!newAddressText.trim()) return toast.error("Please enter the full address details.");
        if (!('geolocation' in navigator)) return toast.error("GPS is not supported in this browser.");

        setIsSavingAddress(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const res = await fetch('/api/auth/save-location', {
                        credentials: 'include',
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            name: newAddressType,
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            address: newAddressText
                        })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        login({ ...user, savedLocations: data.savedLocations }, token);
                        toast.success("Address saved successfully!");
                        setIsAddAddressModalOpen(false);
                        setNewAddressText('');
                        setNewAddressType('Home');
                    } else {
                        toast.error(data.message || "Failed to save address");
                    }
                } catch (error) {
                    console.error("[Add Address] Save error:", error);
                    toast.error("Server error saving address");
                } finally {
                    setIsSavingAddress(false);
                }
            },
            (err) => {
                console.error("[Add Address] Geolocation error:", err);
                setIsSavingAddress(false);
                toast.error("Could not get your location. Please ensure GPS is enabled.");
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
    };

    const handleEnableNotifications = async () => {
        try {
            const fcmToken = await requestFirebaseNotificationPermission();
            if (fcmToken) {
                await fetch('/api/auth/fcm-token', { credentials: 'include', 
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

    const handleOpenEditProfile = () => {
        setEditName(user?.name || '');
        setEditPhone(user?.phone || '');
        setIsEditingProfile(true);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!editName.trim()) return toast.error("Name is required");
        if (!editPhone.trim() || editPhone.trim().length < 10) return toast.error("Valid phone required");

        setIsUpdating(true);
        try {
            const res = await fetch('/api/auth/update-profile', { credentials: 'include', 
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName, phone: editPhone })
            });
            const data = await res.json();
            if (res.ok) {
                login({ ...user, name: data.user.name, phone: data.user.phone }, token);
                toast.success("Profile updated!");
                setIsEditingProfile(false);
            } else {
                toast.error(data.message || "Failed to update profile");
            }
        } catch (error) {
            toast.error("Server error updating profile");
        } finally {
            setIsUpdating(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans">

            {/* ════════ HEADER NAV ════════ */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
                <button
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate(-1); }}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                >
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Settings</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                <div>
                    <h3 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">General</h3>
                    <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <SettingRow icon={<IconUser />} title="Edit Profile" subtitle="Name & Contact" onClick={handleOpenEditProfile} />
                        <SettingRow icon={<IconMapPin />} title="Addresses" subtitle="Manage delivery locations" rightText={user.savedLocations?.length ? `${user.savedLocations.length} Saved` : 'None'} onClick={() => setIsAddressesModalOpen(true)} isLast={true} />
                    </div>
                </div>

                <div>
                    <h3 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">App Settings</h3>
                    <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <SettingRow icon={<IconBell />} title="Notifications" subtitle="Order alerts & offers" badge={Notification.permission === 'granted' ? 'Enabled' : 'Off'} onClick={handleEnableNotifications} isLast={true} />
                    </div>
                </div>

                <div>
                    <h3 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Legal</h3>
                    <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <SettingRow icon={<IconShield />} title="Privacy Policy" onClick={() => navigate('/privacy-policy')} isLast={true} />
                    </div>
                </div>

                <div className="pt-2">
                    <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-rose-50 overflow-hidden">
                        <SettingRow icon={<IconTrash />} title="Delete Account" subtitle="Permanently erase data" isDanger={true} onClick={handleDeleteAccount} isLast={true} />
                    </div>
                </div>
            </div>

            {/* ─── MODAL: EDIT PROFILE ─── */}
            <Modal isOpen={isEditingProfile} onClose={() => setIsEditingProfile(false)} title="Edit Profile">
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="relative">
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Name" />
                        <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Full Name</label>
                    </div>
                    <div className="relative">
                        <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required minLength={10} maxLength={15} className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder-transparent" placeholder="Phone" />
                        <label className="absolute left-4 top-4 text-[11px] font-black text-slate-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-amber-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Phone Number</label>
                    </div>
                    <Button type="submit" isLoading={isUpdating} fullWidth className="mt-2" size="lg">
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </Modal>

            {/* ─── MODAL: ADDRESSES ─── */}
            <Modal isOpen={isAddressesModalOpen} onClose={() => setIsAddressesModalOpen(false)} title="Saved Addresses">
                <div className="space-y-3">
                    {user?.savedLocations && user.savedLocations.length > 0 ? (
                        user.savedLocations.map(loc => (
                            <div key={loc._id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                        <IconMapPin />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-black text-slate-900 tracking-tight">{loc.name}</span>
                                        <span className="text-[11px] font-semibold text-slate-500 mt-0.5 line-clamp-1">{loc.address || 'Saved Location'}</span>
                                    </div>
                                </div>
                                <Button size="sm" variant="danger" onClick={() => handleDeleteLocation(loc._id)} className="text-[11px] uppercase tracking-wider">
                                    Delete
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="w-14 h-14 bg-white text-slate-300 border border-slate-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4">
                                <IconMapPin />
                            </div>
                            <h4 className="text-[15px] font-black text-slate-900 tracking-tight">No saved addresses</h4>
                            <p className="text-[12px] font-semibold text-slate-500 mt-1">Addresses save automatically during checkout.</p>
                        </div>
                    )}

                    {/* Add New Address */}
                    <button
                        onClick={() => { if (navigator.vibrate) navigator.vibrate(30); setIsAddAddressModalOpen(true); }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/50 text-amber-700 text-[13px] font-black uppercase tracking-wider active:scale-[0.98] active:bg-amber-50 transition-all"
                    >
                        <span className="text-[16px] leading-none">＋</span> Add New Address
                    </button>
                </div>
            </Modal>

            {/* ─── MODAL: ADD NEW ADDRESS ─── */}
            <Modal isOpen={isAddAddressModalOpen} onClose={() => !isSavingAddress && setIsAddAddressModalOpen(false)} title="New Address">
                <div className="space-y-5">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
                        <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                            We will securely capture your <strong>current GPS location</strong> when you save this address. Please make sure you are physically at this address right now, so our delivery partners can find you easily.
                        </p>
                    </div>

                    <div>
                        <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Address Type</span>
                        <div className="grid grid-cols-3 gap-2">
                            {['Home', 'Office', 'Other'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => { if (navigator.vibrate) navigator.vibrate(20); setNewAddressType(type); }}
                                    className={`py-3 rounded-xl border font-bold text-[14px] active:scale-[0.97] transition-all ${newAddressType === type ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Full Address Details</span>
                        <textarea
                            value={newAddressText}
                            onChange={(e) => setNewAddressText(e.target.value)}
                            rows={3}
                            placeholder="House No., Building, Street, Area, Landmark..."
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold text-[13px] focus:outline-none focus:border-amber-400 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium"
                        />
                    </div>

                    <Button
                        onClick={handleSaveNewAddress}
                        isLoading={isSavingAddress}
                        fullWidth
                        className="text-[15px]"
                        size="lg"
                    >
                        {isSavingAddress ? 'Getting Location...' : 'Save Address'}
                    </Button>
                </div>
            </Modal>

            {/* ─── MODAL: DELETE ACCOUNT ─── */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={<span className="text-rose-600">Delete Account</span>}>
                <div className="mb-6">
                    <p className="text-[13px] font-medium text-slate-600 mb-2">
                        This action is permanent and cannot be undone. All your orders, settings, and saved data will be erased.
                    </p>
                    <p className="text-[13px] font-black text-slate-800">
                        Please type <span className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded">DELETE</span> to confirm.
                    </p>
                </div>
                <div className="space-y-5">
                    <div className="relative">
                        <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} required className="peer w-full pt-6 pb-2 px-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-rose-400 focus:bg-white transition-all placeholder-transparent" placeholder="DELETE" />
                        <label className="absolute left-4 top-4 text-[11px] font-black text-rose-400 uppercase tracking-widest peer-focus:-translate-y-2 peer-focus:text-rose-500 transition-all peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case">Type DELETE</label>
                    </div>
                    <Button variant="danger" disabled={deleteConfirmText !== "DELETE"} onClick={confirmDeleteAccount} fullWidth className="mt-2 text-[15px]" size="lg">
                        Delete Account Permanently
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default CustomerSettings;