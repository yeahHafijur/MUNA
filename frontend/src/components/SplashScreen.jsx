import { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
    const [fadeOut, setFadeOut] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            handleFinish();
        }, 2800); // 2.8 seconds total duration before fade out starts
        return () => clearTimeout(timer);
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
                @keyframes letterPop {
                    0% { transform: translateY(40px) scale(0.8) rotate(-10deg); opacity: 0; filter: blur(10px); color: #fff; }
                    50% { transform: translateY(-10px) scale(1.1) rotate(5deg); opacity: 1; filter: blur(0px); color: #ffe680; }
                    100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; color: #f8cb46; }
                }
                .muna-logo-container {
                    display: flex;
                    gap: 4px;
                    font-size: 5.5rem;
                    font-weight: 900;
                    font-family: 'Arial Black', 'Impact', 'Outfit', system-ui, sans-serif;
                    letter-spacing: -4px;
                    background: linear-gradient(135deg, #f8cb46, #e0b431, #f8cb46);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 10px 15px rgba(248, 203, 70, 0.4));
                }
                .muna-letter {
                    display: inline-block;
                    opacity: 0;
                    animation: letterPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                .muna-m { animation-delay: 0.1s; }
                .muna-u { animation-delay: 0.25s; }
                .muna-n { animation-delay: 0.4s; }
                .muna-a { animation-delay: 0.55s; }
                
                @keyframes subtitleFade {
                    0% { opacity: 0; transform: translateY(10px); letter-spacing: 2px; }
                    100% { opacity: 1; transform: translateY(0); letter-spacing: 6px; }
                }
                .muna-subtitle {
                    margin-top: 5px;
                    font-size: 0.8rem;
                    font-weight: 900;
                    color: #e0b431;
                    font-family: 'Outfit', 'Inter', system-ui, sans-serif;
                    text-transform: uppercase;
                    opacity: 0;
                    animation: subtitleFade 0.8s ease-out forwards;
                    animation-delay: 1.1s;
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

            <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center mb-4">
                    <img src="/muna-logo-new.png" alt="Muna Logo" className="w-32 h-32 object-contain filter drop-shadow-xl animate-bounce" style={{ animationDuration: '2s' }} />
                </div>
                <div className="muna-subtitle">GROCERY IN MINUTES</div>
            </div>
        </div>
    );
};

export default SplashScreen;
