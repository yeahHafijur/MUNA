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
        <div className={`fixed inset-0 z-[9999] bg-[#fdfaf3] flex items-center justify-center overflow-hidden transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            
            {/* Spinning Mandala Background */}
            <div 
                className="absolute w-[200vmax] h-[200vmax] opacity-20 pointer-events-none"
                style={{ 
                    backgroundImage: "url('/mandala_pattern.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "repeat",
                    animation: "spin 45s linear infinite"
                }}
            />

            <div className={`relative w-72 sm:w-96 flex items-center justify-center transition-opacity duration-300 z-10 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}>
                <video 
                    ref={videoRef}
                    className="w-full h-auto rounded-2xl shadow-xl shadow-yellow-400/50 border-2 border-yellow-400"
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
