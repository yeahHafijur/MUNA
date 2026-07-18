import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

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
    const { colors, isDark } = useTheme();
    
    const baseStyles = "relative flex-row items-center justify-center rounded-xl";
    
    const getBgColor = () => {
        switch (variant) {
            case 'primary': return colors.accent;
            case 'secondary': return colors.surface;
            case 'danger': return colors.danger;
            case 'ghost': return 'transparent';
            case 'dark': return isDark ? colors.elevated : '#0f172a';
            default: return colors.accent;
        }
    };

    const getBorderColor = () => {
        switch (variant) {
            case 'secondary': return colors.borderStrong;
            case 'ghost': return 'transparent';
            default: return 'transparent';
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'primary': return colors.accentText;
            case 'secondary': return colors.primaryText;
            case 'danger': return '#ffffff';
            case 'ghost': return colors.secondaryText;
            case 'dark': return '#ffffff';
            default: return colors.primaryText;
        }
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
                ${sizes[size]} 
                ${fullWidth ? 'w-full' : ''} 
                ${disabled ? 'opacity-70' : ''}
                ${className}
            `}
            style={{
                backgroundColor: getBgColor(),
                borderColor: getBorderColor(),
                borderWidth: variant === 'secondary' ? 2 : 0,
            }}
        >
            {isLoading && (
                <ActivityIndicator 
                  color={variant === 'primary' || variant === 'secondary' || variant === 'ghost' ? (isDark ? '#FFFFFF' : '#334155') : '#ffffff'} 
                  size="small" 
                  className="mr-2"
                />
            )}
            
            {typeof children === 'string' ? (
                <Text 
                    className={`${textSizes[size]} ${textClassName}`}
                    style={{ color: getTextColor() }}
                >
                    {children}
                </Text>
            ) : (
                children
            )}
        </TouchableOpacity>
    );
};

export default Button;
