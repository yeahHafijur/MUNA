import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/* ─── Premium Crisp Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IconChevron = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const IconPackage = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>;
const IconHeart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const IconSettings = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconLogout = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;
const IconCamera = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>;
const IconMapPin = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const IconHelp = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 0v.5m0 2h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const MenuRow = ({ icon, title, subtitle, onClick, isDanger, isLast }) => (
    <div
        onClick={() => {
            if (navigator.vibrate) navigator.vibrate(40);
            onClick();
        }}
        className={`flex items-center justify-between p-4 bg-white active:bg-slate-100 transition-colors cursor-pointer ${!isLast ? 'border-b border-slate-50' : ''}`}
    >
        <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-700'}`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className={`text-[15px] font-black tracking-tight ${isDanger ? 'text-red-600' : 'text-slate-900'}`}>{title}</span>
                {subtitle && <span className="text-xs font-semibold text-slate-400 mt-0.5">{subtitle}</span>}
            </div>
        </div>
        {!isDanger && <IconChevron />}
    </div>
);

const QuickActionChip = ({ icon, label, onClick }) => (
    <div
        onClick={() => {
            if (navigator.vibrate) navigator.vibrate(40);
            onClick();
        }}
        className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] active:scale-95 transition-transform cursor-pointer"
    >
        <div className="text-slate-700 mb-1.5">{icon}</div>
        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
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
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#F8FAFC] overflow-hidden font-sans">

            {/* ─── NATIVE HEADER ─── */}
            <div className="bg-white px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-slate-100">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform">
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Account</span>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                {/* ─── PREMIUM PROFILE CARD ─── */}
                <div className="px-4 py-5">
                    <div className="bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-5">
                        <div className="relative flex-shrink-0">
                            <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-4xl font-black shadow-inner">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 border border-slate-100 active:scale-90 transition-transform">
                                <IconCamera />
                            </button>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                            <h2 className="text-xl font-black text-slate-900 truncate tracking-tight mb-1">{user.name}</h2>
                            <p className="text-[13px] text-slate-500 font-semibold truncate">{user.email}</p>
                            <span className="inline-flex items-center gap-1.5 mt-2 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg text-[11px] font-black text-amber-700 w-max tracking-wide">
                                📞 {user.phone || 'Add Phone'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── QUICK ACTIONS GRID ─── */}
                <div className="grid grid-cols-3 gap-3 px-4 mb-6">
                    <QuickActionChip icon={<IconPackage />} label="Orders" onClick={() => navigate('/profile/orders')} />
                    <QuickActionChip icon={<IconMapPin />} label="Addresses" onClick={() => navigate('/profile/settings')} />
                    <QuickActionChip icon={<IconHeart />} label="Wishlist" onClick={() => navigate('/profile/wishlist')} />
                </div>

                {/* ─── HUB MENU ACTIONS ─── */}
                <div className="px-4 space-y-5">

                    <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                        <MenuRow
                            icon={<IconPackage />}
                            title="My Orders"
                            subtitle="View active & past orders"
                            onClick={() => navigate('/profile/orders')}
                        />
                        <MenuRow
                            icon={<IconHeart />}
                            title="My Wishlist"
                            subtitle="View your liked items"
                            onClick={() => navigate('/profile/wishlist')}
                        />
                        <MenuRow
                            icon={<IconSettings />}
                            title="Profile & Settings"
                            subtitle="Edit details & notifications"
                            onClick={() => navigate('/profile/settings')}
                            isLast={true}
                        />
                    </div>

                    <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-amber-100 overflow-hidden mb-6">
                        <MenuRow
                            icon={<span className="text-xl">🏪</span>}
                            title="Request to be a Vendor"
                            subtitle="Open your own shop on MUNA"
                            onClick={() => navigate('/profile/vendor-request')}
                            isLast={true}
                        />
                    </div>

                    <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-red-50 overflow-hidden mb-6">
                        <MenuRow
                            icon={<IconLogout />}
                            title="Sign Out"
                            isDanger={true}
                            onClick={handleLogout}
                            isLast={true}
                        />
                    </div>

                    <div className="text-center pb-8">
                        <p className="text-xs text-slate-400 font-bold tracking-wide">MUNA App v2.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;