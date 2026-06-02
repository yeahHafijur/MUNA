import { useEffect, useState, useRef } from 'react';

const SplashScreen = ({ onFinish }) => {
    const [fadeOut, setFadeOut] = useState(false);
    const videoRef = useRef(null);

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
        <div className={`fixed inset-0 z-[9999] bg-[#fcf9f2] flex items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
                <video 
                    ref={videoRef}
                    className="w-full h-full object-cover shadow-2xl rounded-full"
                    src="/MunaIntro.mp4"
                    playsInline
                    muted
                    autoPlay
                    onEnded={handleFinish}
                    style={{
                        WebkitMaskImage: 'radial-gradient(circle, black 50%, transparent 80%)',
                        maskImage: 'radial-gradient(circle, black 50%, transparent 80%)'
                    }}
                />
            </div>
        </div>
    );
};

export default SplashScreen;
