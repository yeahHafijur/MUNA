import { useEffect, useState, useRef } from 'react';

const SplashScreen = ({ onFinish }) => {
    const [fadeOut, setFadeOut] = useState(false);
    const videoRef = useRef(null);

    const [isVideoReady, setIsVideoReady] = useState(false);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.log("Video auto-play failed", error);
                // If autoplay fails, skip splash
                handleFinish();
            });
        }
    }, []);

    const handleFinish = () => {
        setFadeOut(true);
        setTimeout(() => {
            onFinish();
        }, 500);
    };

    // Fallback timer in case video fails to load or gets stuck
    useEffect(() => {
        const fallbackTimer = setTimeout(() => {
            handleFinish();
        }, 5000); // max 5 seconds
        
        return () => clearTimeout(fallbackTimer);
    }, []);

    return (
        <div className={`fixed inset-0 z-[9999] bg-[#fdfaf3] flex items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`relative w-64 sm:w-80 aspect-square flex items-center justify-center overflow-hidden rounded-2xl shadow-[0_0_50px_10px_rgba(250,204,21,0.4)] border border-yellow-200/50 transition-opacity duration-300 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}>
                <video 
                    ref={videoRef}
                    className="w-full h-full object-cover scale-[1.15]"
                    src="/MunaIntro.mp4"
                    playsInline
                    muted
                    autoPlay
                    onCanPlay={() => setIsVideoReady(true)}
                    onEnded={handleFinish}
                />
            </div>
        </div>
    );
};

export default SplashScreen;
