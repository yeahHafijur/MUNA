import { useEffect, useState } from 'react';

const SplashScreen = ({ onFinish }) => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Wait for 2 seconds, then start fade out animation
        const timer1 = setTimeout(() => {
            setFadeOut(true);
        }, 2000);

        // After fade out completes, call onFinish to remove splash screen
        const timer2 = setTimeout(() => {
            onFinish();
        }, 2500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onFinish]);

    return (
        <div className={`fixed inset-0 z-[9999] bg-[#fdfaf3] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative animate-pulse">
                <img 
                    src="/muna-logo.png" 
                    alt="MUNA Intro" 
                    className="w-48 sm:w-64 h-auto drop-shadow-xl"
                />
            </div>
            
            {/* Optional Loading Indicator below logo */}
            <div className="mt-8 flex gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
        </div>
    );
};

export default SplashScreen;
