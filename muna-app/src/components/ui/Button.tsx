import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    textClassName?: string;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
    children, 
    onPress, 
    variant = 'primary', 
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    textClassName = '',
    fullWidth = false,
}) => {
    
    const baseStyles = "relative flex-row items-center justify-center rounded-xl";
    
    const variants = {
        primary: "bg-amber-400 border border-transparent shadow-sm",
        secondary: "bg-white border-2 border-slate-200",
        danger: "bg-rose-500 border border-transparent shadow-sm",
        ghost: "bg-transparent border border-transparent",
        dark: "bg-slate-900 border border-transparent shadow-sm"
    };

    const textVariants = {
        primary: "text-amber-950",
        secondary: "text-slate-800",
        danger: "text-white",
        ghost: "text-slate-600",
        dark: "text-white"
    };

    const sizes = {
        sm: "px-3 py-2",
        md: "px-4 py-3",
        lg: "px-6 py-4",
        icon: "p-3"
    };

    const textSizes = {
        sm: "text-xs font-bold tracking-tight",
        md: "text-sm font-bold tracking-tight",
        lg: "text-[15px] font-bold tracking-tight",
        icon: ""
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            className={`
                ${baseStyles} 
                ${variants[variant]} 
                ${sizes[size]} 
                ${fullWidth ? 'w-full' : ''} 
                ${disabled ? 'opacity-70' : ''}
                ${className}
            `}
        >
            {isLoading && (
                <ActivityIndicator 
                  color={variant === 'primary' || variant === 'secondary' || variant === 'ghost' ? '#334155' : '#ffffff'} 
                  size="small" 
                  className="mr-2"
                />
            )}
            
            {typeof children === 'string' ? (
                <Text className={`
                    ${textVariants[variant]} 
                    ${textSizes[size]} 
                    ${textClassName}
                `}>
                    {children}
                </Text>
            ) : (
                children
            )}
        </TouchableOpacity>
    );
};

export default Button;
