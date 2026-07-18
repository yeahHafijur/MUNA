import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, ShoppingBag, UserRound } from 'lucide-react-native';

import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { cartItems } = useCart();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: [
          {
            paddingTop: 7,
            paddingHorizontal: 8,
            backgroundColor: colors.tabBar,
            borderTopWidth: 1,
            borderTopColor: colors.tabBarBorder,
            elevation: 10,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 10,
            height: (Platform.OS === 'ios' ? 86 : 65) + insets.bottom,
            paddingBottom: (Platform.OS === 'ios' ? 23 : 8) + insets.bottom,
          },
        ],
        tabBarItemStyle: { marginHorizontal: 3, borderRadius: 16 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700', marginTop: 2 },
        tabBarBadgeStyle: {
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          fontSize: 9,
          fontWeight: '900',
          lineHeight: 17,
          backgroundColor: colors.badge,
          color: '#FFFFFF',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={size} color={color} fill={focused ? (isDark ? '#422006' : '#fef3c7') : 'none'} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? Math.min(cartCount, 99) : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <ShoppingBag
              size={size}
              color={color}
              fill={focused ? (isDark ? '#422006' : '#fef3c7') : 'none'}
              strokeWidth={2.2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size, focused }) => (
            <UserRound
              size={size}
              color={color}
              fill={focused ? (isDark ? '#422006' : '#fef3c7') : 'none'}
              strokeWidth={2.2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
