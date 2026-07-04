import { useState, useEffect, memo } from 'react';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        if (localStorage.getItem('muna_pwa_dismissed') === 'true') {
            setIsDismissed(true);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleClose = () => {
        setShowPrompt(false);
        setIsDismissed(true);
        localStorage.setItem('muna_pwa_dismissed', 'true');
    };

    if (!showPrompt || isDismissed) return null;

    return (
        <div className="fixed bottom-24 inset-x-4 z-[120] animate-in slide-in-from-bottom-5 fade-in duration-300 md:bottom-6 md:left-auto md:right-6 md:w-96">
            <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-slate-800 relative overflow-hidden">
                {/* Close Button */}
                <button onClick={handleClose} className="absolute top-2 right-2 text-slate-500 hover:text-white p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                    <img src="/muna-logo-new.png" alt="MUNA" className="w-8 h-8 object-contain" />
                </div>
                <div className="flex-1">
                    <h4 className="text-white font-black text-[14px] leading-tight mb-0.5">Install MUNA App</h4>
                    <p className="text-slate-400 text-[11px] font-bold leading-tight">For faster delivery & better experience</p>
                </div>
                <button 
                    onClick={handleInstallClick}
                    className="bg-amber-400 text-amber-950 px-4 py-2 rounded-xl font-black text-[12px] active:scale-95 transition-transform shrink-0"
                >
                    Install
                </button>
            </div>
        </div>
    );
};

export default memo(InstallPWA);
