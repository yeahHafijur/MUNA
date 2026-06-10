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
                    0% { transform: translateY(40px) scale(0.8); opacity: 0; filter: blur(10px); color: #fff; }
                    60% { transform: translateY(-5px) scale(1.05); opacity: 1; filter: blur(0px); color: #6366f1; }
                    100% { transform: translateY(0) scale(1); opacity: 1; color: #4338ca; }
                }
                .muna-logo-container {
                    display: flex;
                    gap: 6px;
                    font-size: 4.5rem;
                    font-weight: 900;
                    font-family: 'Inter', system-ui, sans-serif;
                    letter-spacing: -3px;
                }
                .muna-letter {
                    display: inline-block;
                    opacity: 0;
                    animation: letterPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    text-shadow: 0 10px 20px rgba(67, 56, 202, 0.2);
                }
                .muna-m { animation-delay: 0.1s; }
                .muna-u { animation-delay: 0.25s; }
                .muna-n { animation-delay: 0.4s; }
                .muna-a { animation-delay: 0.55s; }
                
                @keyframes subtitleFade {
                    0% { opacity: 0; transform: translateY(5px); letter-spacing: 2px; }
                    100% { opacity: 1; transform: translateY(0); letter-spacing: 5px; }
                }
                .muna-subtitle {
                    margin-top: 8px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #f8cb46;
                    text-transform: uppercase;
                    opacity: 0;
                    animation: subtitleFade 0.8s ease-out forwards;
                    animation-delay: 1s;
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
                <div className="muna-logo-container">
                    <span className="muna-letter muna-m">M</span>
                    <span className="muna-letter muna-u">U</span>
                    <span className="muna-letter muna-n">N</span>
                    <span className="muna-letter muna-a">A</span>
                </div>
                <div className="muna-subtitle">GROCERY IN MINUTES</div>
            </div>
        </div>
    );
};

export default SplashScreen;
