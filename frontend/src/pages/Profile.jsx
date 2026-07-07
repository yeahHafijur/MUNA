import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/* ─── Icons ─── */
const IconBack = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);
const IconChevron = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-slate-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);
const IconPackage = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);
const IconHeart = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);
const IconSettings = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.342 3.656a2.25 2.25 0 013.316 0l.216.216c.35.35.856.467 1.32.327l.302-.09a2.25 2.25 0 012.83 1.637l.067.31c.112.516.486.918.995 1.056l.288.077a2.25 2.25 0 011.642 2.824l-.116.353c-.22.67-.044 1.41.44 1.895l.173.173a2.25 2.25 0 010 3.316l-.173.173c-.483.484-.659 1.224-.44 1.895l.116.353a2.25 2.25 0 01-1.642 2.824l-.288.077c-.509.138-.883.54-.995 1.056l-.067.31a2.25 2.25 0 01-2.83 1.637l-.302-.09c-.464-.14-.97-.023-1.32.327l-.216.216a2.25 2.25 0 01-3.316 0l-.216-.216c-.35-.35-.856-.467-1.32-.327l-.302.09a2.25 2.25 0 01-2.83-1.637l-.067-.31c-.112-.516-.486-.918-.995-1.056l-.288-.077a2.25 2.25 0 01-1.642-2.824l.116-.353c.22-.67.044-1.41-.44-1.895l-.173-.173a2.25 2.25 0 010-3.316l.173-.173c.484-.484.659-1.224.44-1.895l-.116-.353a2.25 2.25 0 011.642-2.824l.288-.077c.509-.138.883-.54.995-1.056l.067-.31a2.25 2.25 0 012.83-1.637l.302.09c.464.14.97.023 1.32-.327l.216-.216zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const IconLogout = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);
const IconEdit = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);
const IconMapPin = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);
const IconVendor = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
);

/* ─── Reusable Menu Row ─── */
const MenuRow = ({ icon, title, subtitle, onClick, isDanger, isLast }) => (
    <div
        onClick={() => { if (navigator.vibrate) navigator.vibrate(40); onClick(); }}
        className={`flex items-center justify-between p-3.5 bg-white active:bg-slate-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-slate-100' : ''}`}
    >
        <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-700'}`}>
                {icon}
            </div>
            <div className="flex flex-col min-w-0">
                <span className={`text-[14px] font-bold tracking-tight truncate ${isDanger ? 'text-rose-600' : 'text-slate-900'}`}>{title}</span>
                {subtitle && <span className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">{subtitle}</span>}
            </div>
        </div>
        {!isDanger && <IconChevron />}
    </div>
);

/* ─── Quick Action Chip ─── */
const QuickActionChip = ({ icon, label, onClick, colorClass }) => (
    <div
        onClick={() => { if (navigator.vibrate) navigator.vibrate(40); onClick(); }}
        className="flex flex-col items-center justify-center bg-white py-3 rounded-2xl border border-slate-100/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-95 transition-transform cursor-pointer"
    >
        <div className={`mb-1 ${colorClass}`}>{icon}</div>
        <span className="text-[11px] font-bold text-slate-600 tracking-wide">{label}</span>
    </div>
);

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = () => {
        toast.success("Logged out successfully");
        logout();
        navigate('/');
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#F5F6F8] overflow-hidden font-sans">
            
            {/* ── HEADER ── */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform">
                        <IconBack />
                    </button>
                    <span className="text-[17px] font-extrabold text-slate-900 tracking-tight">Account</span>
                    <div className="w-9" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                
                {/* ── PROFILE CARD ── */}
                <div className="bg-white p-5 border-b border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-amber-950 text-2xl font-black shadow-sm ring-2 ring-amber-100">
                                {(user?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <button onClick={() => navigate('/profile/settings')} className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-slate-600 border border-slate-100 active:scale-90">
                                <IconEdit />
                            </button>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <h2 className="text-[18px] font-extrabold text-slate-900 truncate tracking-tight">{user.name}</h2>
                            <p className="text-[12px] font-medium text-slate-500 truncate mb-1.5">{user.email}</p>
                            <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-black text-amber-700 w-max tracking-wider uppercase border border-amber-100/50">
                                {user.phone || 'NO PHONE ADDED'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── QUICK ACTIONS ── */}
                <div className="grid grid-cols-3 gap-3 p-4">
                    <QuickActionChip icon={<IconPackage />} label="Orders" onClick={() => navigate('/profile/orders')} colorClass="text-blue-500" />
                    <QuickActionChip icon={<IconMapPin />} label="Addresses" onClick={() => navigate('/profile/settings')} colorClass="text-emerald-500" />
                    <QuickActionChip icon={<IconHeart />} label="Wishlist" onClick={() => navigate('/profile/wishlist')} colorClass="text-rose-500" />
                </div>

                {/* ── MENUS ── */}
                <div className="px-4 space-y-3 pb-8">
                    
                    <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <MenuRow icon={<IconPackage />} title="My Orders" subtitle="Track or reorder past items" onClick={() => navigate('/profile/orders')} />
                        <MenuRow icon={<IconHeart />} title="My Wishlist" subtitle="Saved items for later" onClick={() => navigate('/profile/wishlist')} />
                        <MenuRow icon={<IconSettings />} title="Profile Settings" subtitle="Edit details & locations" onClick={() => navigate('/profile/settings')} isLast />
                    </div>

                    <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <MenuRow icon={<IconVendor />} title="Become a Vendor" subtitle="Open your own shop on MUNA" onClick={() => navigate('/profile/vendor-request')} isLast />
                    </div>

                    <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                        <MenuRow icon={<IconLogout />} title="Log Out" isDanger onClick={handleLogout} isLast />
                    </div>

                    <div className="text-center pt-4">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">MUNA App v2.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;