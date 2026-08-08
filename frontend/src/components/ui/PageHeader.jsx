import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

const IcoBack = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

/**
 * Shared page header for customer/vendor sub-pages.
 * variant="white" → clean content-page header (slate back button, subtle border).
 * variant="amber" → branded header matching Home / Notifications (rounded bottom, white/30 back button).
 */
const PageHeader = ({ title, subtitle, onBack, right, variant = 'white', sticky = true }) => {
    const navigate = useNavigate();
    const handleBack = onBack || (() => navigate(-1));

    if (variant === 'amber') {
        return (
            <div className={`shrink-0 bg-brand-400 pt-4 px-4 pb-4 shadow-md relative overflow-hidden rounded-b-[20px] ${sticky ? 'sticky top-0' : ''} z-20`}>
                <div className="flex items-center gap-3 relative z-10 max-w-2xl mx-auto">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 bg-white/30 hover:bg-white/50 border border-white/40 text-amber-950 rounded-full flex items-center justify-center active:scale-95 transition-all backdrop-blur-sm shrink-0"
                        aria-label="Back"
                    >
                        <IcoBack />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-[20px] font-black text-amber-950 tracking-tight leading-tight truncate">{title}</h1>
                        {subtitle && <p className="text-[11px] font-bold text-amber-900/80 uppercase tracking-widest mt-0.5 truncate">{subtitle}</p>}
                    </div>
                    {right}
                </div>
            </div>
        );
    }

    return (
        <div className={`shrink-0 bg-white px-4 py-3.5 flex items-center gap-3 border-b border-slate-100 ${sticky ? 'sticky top-0' : ''} z-20`}>
            <button
                onClick={handleBack}
                className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all shrink-0"
                aria-label="Back"
            >
                <IcoBack />
            </button>
            <div className="flex-1 min-w-0">
                <h1 className="text-[17px] font-extrabold text-slate-900 tracking-tight truncate">{title}</h1>
                {subtitle && <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
            {right}
        </div>
    );
};

export default memo(PageHeader);
