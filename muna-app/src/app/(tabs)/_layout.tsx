import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, ShoppingBag, UserRound } from 'lucide-react-native';

import { useCart } from '@/context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { cartItems } = useCart();
  const insets = useSafeAreaInsets();
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#f59e0b', // amber-500
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: [
          styles.tabBar,
          {
            height: (Platform.OS === 'ios' ? 86 : 65) + insets.bottom,
            paddingBottom: (Platform.OS === 'ios' ? 23 : 8) + insets.bottom,
          }
        ],
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBadgeStyle: styles.badge,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={size} color={color} fill={focused ? '#fef3c7' : 'none'} strokeWidth={2.2} />
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
              fill={focused ? '#fef3c7' : 'none'}
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
              fill={focused ? '#fef3c7' : 'none'}
              strokeWidth={2.2}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 7,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9', // slate-100
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabItem: { marginHorizontal: 3, borderRadius: 16 },
  tabLabel: { fontSize: 10.5, fontWeight: '700', marginTop: 2 },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 17,
    backgroundColor: '#ef4444',
    color: '#FFFFFF',
  },
});
