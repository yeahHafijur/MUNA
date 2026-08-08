import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { useUnreadChats } from '../../hooks/useUnreadChats';

const IconBell = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

const IconMapPin = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const HomeHeader = ({ userLocation, onPressLocation }) => {
    const navigate = useNavigate();
    const { data: unreadNotifications = 0 } = useUnreadNotifications();
    const { data: unreadChats = 0 } = useUnreadChats();

    const unreadCount = unreadNotifications + unreadChats;
    const displayLocation = userLocation?.label || (userLocation ? '📍 Current Location' : 'Select your location');

    return (
        <div className="shrink-0 bg-amber-400 pt-4 px-4 pb-4 z-50 shadow-md relative overflow-hidden rounded-b-[20px]">
            {/* Decorative Delivery Element */}
            <div className="absolute right-[-10px] top-2 text-[90px] opacity-[0.15] rotate-12 pointer-events-none drop-shadow-sm">
                🛵
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Top Row: Logo + Bell */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-900/15">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-white rounded-[12px] shadow-sm flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            <img src="/muna-logo-new.png" alt="MUNA" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <span className="block text-[15px] font-black text-amber-950 tracking-tight leading-none">MUNA</span>
                            <span className="block text-[9px] font-bold text-amber-800/70 uppercase tracking-widest mt-1">Delivery in minutes</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/notifications')}
                        className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center text-amber-950 relative active:scale-90 transition-transform"
                        aria-label="Notifications"
                    >
                        <IconBell />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-amber-400 px-0.5 text-white text-[8px] font-black">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Location Row (Clickable) */}
                <button
                    onClick={onPressLocation}
                    className="w-full flex items-center gap-2 mb-4 text-left cursor-pointer active:opacity-70 transition-opacity"
                    aria-label="Select location"
                >
                    <div className="w-8 h-8 bg-amber-900/10 rounded-full flex items-center justify-center text-amber-950 shrink-0">
                        <IconMapPin />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="block text-[10px] font-bold text-amber-900/70 uppercase tracking-widest mb-0.5">Deliver to</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[15px] font-black text-amber-950 truncate">{displayLocation}</span>
                            <svg className="w-4 h-4 text-amber-950 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default memo(HomeHeader);
