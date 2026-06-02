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
            
            {/* Floating Grocery Bubbles */}
            <style>
                {`
                @keyframes floatUp {
                    0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.5; }
                    90% { opacity: 0.5; }
                    100% { transform: translateY(-20vh) rotate(360deg); opacity: 0; }
                }
                .bubble {
                    position: absolute;
                    top: 0;
                    opacity: 0;
                    animation-name: floatUp;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    animation-fill-mode: both;
                    pointer-events: none;
                    user-select: none;
                }
                `}
            </style>
            
            {[
                { icon: '🍎', left: '10%', delay: '0s', duration: '4s', size: 'text-4xl' },
                { icon: '🛒', left: '80%', delay: '0.5s', duration: '4.5s', size: 'text-5xl' },
                { icon: '🥦', left: '25%', delay: '1s', duration: '3.5s', size: 'text-3xl' },
                { icon: '🛍️', left: '70%', delay: '1.5s', duration: '5s', size: 'text-4xl' },
                { icon: '🥖', left: '35%', delay: '0.2s', duration: '4s', size: 'text-5xl' },
                { icon: '🍅', left: '60%', delay: '2s', duration: '4.2s', size: 'text-3xl' },
                { icon: '🥕', left: '15%', delay: '1.2s', duration: '3.8s', size: 'text-4xl' },
                { icon: '🍉', left: '85%', delay: '2.5s', duration: '5.5s', size: 'text-4xl' },
                { icon: '🧅', left: '50%', delay: '0.8s', duration: '4.3s', size: 'text-3xl' },
                { icon: '🥔', left: '5%', delay: '2.2s', duration: '4.8s', size: 'text-5xl' },
                { icon: '🛒', left: '40%', delay: '1.8s', duration: '3.9s', size: 'text-4xl' },
                { icon: '🍇', left: '92%', delay: '0.3s', duration: '4.1s', size: 'text-3xl' },
            ].map((bubble, i) => (
                <div 
                    key={i} 
                    className={`bubble ${bubble.size}`}
                    style={{
                        left: bubble.left,
                        animationDelay: bubble.delay,
                        animationDuration: bubble.duration
                    }}
                >
                    {bubble.icon}
                </div>
            ))}

            <div className={`relative w-[85vw] max-w-sm sm:max-w-md flex items-center justify-center transition-opacity duration-300 z-10 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}>
                <video 
                    ref={videoRef}
                    className="w-full h-auto rounded-3xl shadow-2xl shadow-yellow-500/40"
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
