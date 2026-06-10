import { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';

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
            
            {/* Scattering Grocery Bubbles */}
            <style>
                {`
                @keyframes scatterOut {
                    0% { 
                        transform: translate(0, 0) scale(0.2) rotate(0deg); 
                        opacity: 0; 
                    }
                    15% { 
                        opacity: 0.6; 
                    }
                    80% {
                        opacity: 0.4;
                    }
                    100% { 
                        transform: translate(var(--tx), var(--ty)) scale(1.2) rotate(var(--rot)); 
                        opacity: 0; 
                    }
                }
                .bubble {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    margin-top: -20px;
                    margin-left: -20px;
                    opacity: 0;
                    animation-name: scatterOut;
                    animation-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
                    animation-iteration-count: infinite;
                    animation-fill-mode: both;
                    pointer-events: none;
                    user-select: none;
                    z-index: 1;
                }
                `}
            </style>
            
            {[
                { icon: '🍎', tx: '-40vw', ty: '-40vh', rot: '180deg', delay: '0s', duration: '3.5s', size: 'text-4xl' },
                { icon: '🛒', tx: '35vw', ty: '-45vh', rot: '-90deg', delay: '0.5s', duration: '4s', size: 'text-5xl' },
                { icon: '🥦', tx: '-30vw', ty: '40vh', rot: '90deg', delay: '1s', duration: '3.5s', size: 'text-3xl' },
                { icon: '🛍️', tx: '40vw', ty: '30vh', rot: '45deg', delay: '1.5s', duration: '4.5s', size: 'text-4xl' },
                { icon: '🥖', tx: '-45vw', ty: '-10vh', rot: '-180deg', delay: '0.2s', duration: '3.8s', size: 'text-5xl' },
                { icon: '🍅', tx: '45vw', ty: '-10vh', rot: '120deg', delay: '2s', duration: '3.2s', size: 'text-3xl' },
                { icon: '🥕', tx: '-15vw', ty: '-45vh', rot: '-45deg', delay: '1.2s', duration: '3.8s', size: 'text-4xl' },
                { icon: '🍉', tx: '15vw', ty: '45vh', rot: '220deg', delay: '2.5s', duration: '4s', size: 'text-4xl' },
                { icon: '🧅', tx: '-20vw', ty: '35vh', rot: '60deg', delay: '0.8s', duration: '3.3s', size: 'text-3xl' },
                { icon: '🥔', tx: '25vw', ty: '-35vh', rot: '-60deg', delay: '2.2s', duration: '3.8s', size: 'text-5xl' },
                { icon: '🛒', tx: '35vw', ty: '40vh', rot: '100deg', delay: '1.8s', duration: '3.9s', size: 'text-4xl' },
                { icon: '🍇', tx: '-40vw', ty: '20vh', rot: '-100deg', delay: '0.3s', duration: '3.1s', size: 'text-3xl' },
            ].map((bubble, i) => (
                <div 
                    key={i} 
                    className={`bubble ${bubble.size}`}
                    style={{
                        '--tx': bubble.tx,
                        '--ty': bubble.ty,
                        '--rot': bubble.rot,
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
                    className="splashscreen-style-1"
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
