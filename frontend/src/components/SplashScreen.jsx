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
        <div className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            <video 
                ref={videoRef}
                className="w-full h-full object-contain"
                src="/muna-intro.mp4"
                playsInline
                muted
                autoPlay
                onEnded={handleFinish}
            />
        </div>
    );
};

export default SplashScreen;
