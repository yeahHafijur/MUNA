import React from 'react';

const Button = ({ 
    children, 
    onClick, 
    type = 'button', 
    variant = 'primary', 
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    fullWidth = false,
    ...props 
}) => {
    
    const baseStyles = "relative inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 active:scale-[0.98] outline-none disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-[0_4px_12px_rgba(251,191,36,0.3)] hover:shadow-[0_6px_16px_rgba(251,191,36,0.4)] disabled:shadow-none",
        secondary: "bg-white text-slate-800 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm",
        danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_16px_rgba(244,63,94,0.4)] disabled:shadow-none",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        dark: "bg-slate-900 hover:bg-slate-800 text-white shadow-[0_4px_12px_rgba(15,23,42,0.3)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.4)] disabled:shadow-none"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
        md: "px-4 py-2.5 text-sm rounded-xl gap-2",
        lg: "px-6 py-3.5 text-[15px] rounded-2xl gap-2.5",
        icon: "p-2.5 rounded-xl flex items-center justify-center"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`
                ${baseStyles} 
                ${variants[variant]} 
                ${sizes[size]} 
                ${fullWidth ? 'w-full' : ''} 
                ${className}
            `}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current opacity-70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            <span className={isLoading ? 'opacity-80' : ''}>
                {children}
            </span>
        </button>
    );
};

export default Button;
