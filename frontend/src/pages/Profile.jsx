import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ─── Heroicons SVG ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IconChevron = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const IconPackage = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>;
const IconSettings = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconLogout = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;
const IconCamera = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>;

const MenuRow = ({ icon, title, subtitle, onClick, isDanger, isLast }) => (
    <div onClick={onClick} className={`flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-50' : ''}`}>
        <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-700'}`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className={`text-base font-extrabold tracking-tight ${isDanger ? 'text-red-600' : 'text-gray-900'}`}>{title}</span>
                {subtitle && <span className="text-[13px] font-medium text-gray-400">{subtitle}</span>}
            </div>
        </div>
        {!isDanger && <IconChevron />}
    </div>
);

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            
            {/* ════════ HEADER NAV ════════ */}
            <div className="bg-white px-4 pt-4 pb-2 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-gray-900 tracking-tight">Account Hub</span>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto pb-24">
                
                {/* ─── PROFILE CARD ─── */}
                <div className="px-4 py-5">
                    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                            <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-white text-4xl font-black shadow-inner">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 border border-gray-100 active:scale-90 transition-transform">
                                <IconCamera />
                            </button>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                            <h2 className="text-xl font-black text-gray-900 truncate tracking-tight mb-1">{user.name}</h2>
                            <p className="text-sm text-gray-500 truncate font-semibold">{user.email}</p>
                            <p className="text-sm text-amber-600 font-bold mt-1 tracking-wide">{user.phone || '+91 - Add phone'}</p>
                        </div>
                    </div>
                </div>

                {/* ─── HUB MENU ACTIONS ─── */}
                <div className="px-4 space-y-4">
                    
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                        <MenuRow 
                            icon={<IconPackage />} 
                            title="My Orders" 
                            subtitle="View past and active orders" 
                            onClick={() => navigate('/profile/orders')} 
                        />
                        <MenuRow 
                            icon={<IconSettings />} 
                            title="Profile & Settings" 
                            subtitle="Edit details, addresses, notifications" 
                            onClick={() => navigate('/profile/settings')} 
                            isLast={true}
                        />
                    </div>

                    <div className="bg-white rounded-[24px] shadow-sm border border-red-50 overflow-hidden mt-6">
                        <MenuRow 
                            icon={<IconLogout />} 
                            title="Sign Out" 
                            isDanger={true} 
                            onClick={handleLogout} 
                            isLast={true}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;