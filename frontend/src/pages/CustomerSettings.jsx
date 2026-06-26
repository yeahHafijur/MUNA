import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { requestFirebaseNotificationPermission } from '../firebase';

/* ─── Heroicons SVG ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IconChevron = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const IconUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IconMapPin = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const IconHeart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const IconBell = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const IconHelp = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 0v.5m0 2h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
const IconDocument = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IconLogout = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;

const SettingRow = ({ icon, title, subtitle, onClick, rightText, isDanger, badge, isLast }) => (
    <div onClick={onClick} className={`flex items-center justify-between px-4 py-3.5 bg-white active:bg-gray-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-50' : ''}`}>
        <div className="flex items-center gap-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-700'}`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className={`text-sm font-bold tracking-tight ${isDanger ? 'text-red-600' : 'text-gray-900'}`}>{title}</span>
                {subtitle && <span className="text-xs font-medium text-gray-400 mt-0.5">{subtitle}</span>}
            </div>
        </div>
        <div className="flex items-center gap-2">
            {rightText && <span className="text-xs font-semibold text-gray-400">{rightText}</span>}
            {badge && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">{badge}</span>}
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

    useEffect(() => {
        if (!token) navigate('/login');
    }, [token, navigate]);

    const handleLogout = () => { logout(); navigate('/'); };

    const handleDeleteAccount = async () => {
        if (!window.confirm("WARNING: This will permanently delete your account, orders, and all data. Are you absolutely sure?")) return;

        try {
            const res = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert("Account deleted successfully.");
                logout();
                navigate('/');
            } else {
                alert(data.message || "Failed to delete account");
            }
        } catch (error) {
            console.error("Delete account error:", error);
            alert("An error occurred while deleting account");
        }
    };

    const handleDeleteLocation = async (id) => {
        if (!window.confirm("Delete this saved location?")) return;
        try {
            const res = await fetch(`/api/auth/delete-location/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) { login({ ...user, savedLocations: data.savedLocations }, token); }
            else { alert(data.message || "Failed to delete location"); }
        } catch (error) { console.error("Error deleting location:", error); }
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
                alert("Notifications enabled successfully!");
            } else {
                alert("Please allow notifications in your browser settings.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to enable notifications.");
        }
    };

    const handleOpenEditProfile = () => {
        setEditName(user?.name || '');
        setEditPhone(user?.phone || '');
        setIsEditingProfile(true);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!editName.trim()) { alert("Name cannot be blank"); return; }
        if (!editPhone.trim() || editPhone.trim().length < 10) { alert("Please enter a valid phone number"); return; }

        setIsUpdating(true);
        try {
            const res = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: editName, phone: editPhone })
            });
            const data = await res.json();
            if (res.ok) {
                login({ ...user, name: data.user.name, phone: data.user.phone }, token);
                alert("Profile updated successfully");
                setIsEditingProfile(false);
            } else {
                alert(data.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Server error while updating profile");
        } finally {
            setIsUpdating(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans pb-24">
            
            {/* ════════ HEADER NAV ════════ */}
            <div className="sticky top-0 z-50 bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-gray-900 tracking-tight">Settings</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-5">
                <div>
                    <h3 className="px-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">General</h3>
                    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                        <SettingRow icon={<IconUser />} title="Edit Profile" subtitle="Name, phone number" onClick={handleOpenEditProfile} />
                        <SettingRow icon={<IconMapPin />} title="Saved Addresses" subtitle="Home, Office, Other" rightText={user.savedLocations?.length ? `${user.savedLocations.length} Saved` : 'None'} onClick={() => setIsAddressesModalOpen(true)} />
                        <SettingRow icon={<IconHeart />} title="Favorites" subtitle="Your liked items & shops" onClick={() => alert("Favorites feature is coming soon!")} isLast={true} />
                    </div>
                </div>

                <div>
                    <h3 className="px-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">App Settings</h3>
                    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                        <SettingRow icon={<IconBell />} title="Notifications" subtitle="Order updates, offers" badge={Notification.permission === 'granted' ? 'Enabled' : 'Off'} onClick={handleEnableNotifications} isLast={true} />
                    </div>
                </div>

                <div>
                    <h3 className="px-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Support & Legal</h3>
                    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                        <SettingRow icon={<IconHelp />} title="Help & Support" subtitle="FAQs, contact us" onClick={() => window.location.href = "mailto:support@munastore.in"} />
                        <SettingRow icon={<IconShield />} title="Privacy Policy" onClick={() => navigate('/privacy-policy')} />
                        <SettingRow icon={<IconDocument />} title="Terms of Service" onClick={() => navigate('/privacy-policy')} isLast={true} />
                    </div>
                </div>

                <div>
                    <div className="bg-white rounded-[20px] shadow-sm border border-red-50 overflow-hidden mb-6">
                        <SettingRow icon={<IconLogout />} title="Sign Out" isDanger={true} onClick={handleLogout} />
                        <SettingRow icon={<IconTrash />} title="Delete Account" subtitle="Permanently delete your data" isDanger={true} onClick={handleDeleteAccount} isLast={true} />
                    </div>
                    <div className="text-center pb-8">
                        <p className="text-xs text-gray-400 font-bold tracking-wide">MUNA App v1.0.0</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Made with ❤️ in India</p>
                    </div>
                </div>
            </div>

            {/* ─── NATIVE BOTTOM SHEET: EDIT PROFILE ─── */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 ease-out">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Edit Profile</h3>
                            <button onClick={() => setIsEditingProfile(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-95 transition-transform">✕</button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-extrabold text-gray-700 tracking-wide">Name</label>
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-extrabold text-gray-700 tracking-wide">Phone Number</label>
                                <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required minLength={10} maxLength={15} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all" />
                            </div>
                            <button type="submit" disabled={isUpdating} className="w-full mt-4 p-4 bg-amber-400 text-gray-900 rounded-2xl font-extrabold text-[15px] active:scale-[0.98] transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.3)] disabled:opacity-70">
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── NATIVE BOTTOM SHEET: SAVED ADDRESSES ─── */}
            {isAddressesModalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 ease-out">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Saved Addresses</h3>
                            <button onClick={() => setIsAddressesModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-95 transition-transform">✕</button>
                        </div>
                        <div className="space-y-3">
                            {user?.savedLocations && user.savedLocations.length > 0 ? (
                                user.savedLocations.map(loc => (
                                    <div key={loc._id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                <IconMapPin />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 tracking-tight">{loc.name}</span>
                                                <span className="text-[11px] font-semibold text-gray-500 mt-0.5 line-clamp-1">{loc.address || 'Saved Location'}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteLocation(loc._id)} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[11px] font-bold active:scale-95 transition-transform">
                                            Delete
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="w-14 h-14 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <IconMapPin />
                                    </div>
                                    <h4 className="text-sm font-extrabold text-gray-900">No saved addresses</h4>
                                    <p className="text-[11px] font-semibold text-gray-500 mt-1">You can save addresses during checkout.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerSettings;
