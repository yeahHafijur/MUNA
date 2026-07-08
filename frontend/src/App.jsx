import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import ScrollToTop from './components/ScrollToTop';
import { onMessageListener } from './firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUnreadNotifications } from './hooks/useUnreadNotifications';
import { useUnreadChats } from './hooks/useUnreadChats';
import InstallPWA from './components/InstallPWA';
import PermissionPrompter from './components/PermissionPrompter';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const ShopDetail = lazy(() => import('./pages/ShopDetail'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const CustomerOrders = lazy(() => import('./pages/CustomerOrders'));
const CustomerSettings = lazy(() => import('./pages/CustomerSettings'));
const Search = lazy(() => import('./pages/Search'));
const Notifications = lazy(() => import('./pages/Notifications'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const AllStores = lazy(() => import('./pages/AllStores'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const VendorRequestForm = lazy(() => import('./pages/VendorRequestForm'));
const DailyMarket = lazy(() => import('./pages/DailyMarket'));
const DailyMarketPost = lazy(() => import('./pages/DailyMarketPost'));
const DailyMarketItemDetail = lazy(() => import('./pages/DailyMarketItemDetail'));
const ChatInbox = lazy(() => import('./pages/ChatInbox'));
const ChatScreen = lazy(() => import('./pages/ChatScreen'));

// Vendor Pages
const VendorHub = lazy(() => import('./pages/vendor/VendorHub'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorMenu = lazy(() => import('./pages/vendor/VendorMenu'));

// Admin Hub & Spoke Pages
const AdminHub = lazy(() => import('./pages/admin/AdminHub'));
const AdminOnboard = lazy(() => import('./pages/admin/AdminOnboard'));
const AdminShops = lazy(() => import('./pages/admin/AdminShops'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminGodown = lazy(() => import('./pages/admin/AdminGodown'));
const AdminApprovals = lazy(() => import('./pages/admin/AdminApprovals'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminVendorRequests = lazy(() => import('./pages/admin/AdminVendorRequests'));
const AdminBroadcast = lazy(() => import('./pages/admin/AdminBroadcast'));
const AdminLiveOrders = lazy(() => import('./pages/admin/AdminLiveOrders'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminCatalog = lazy(() => import('./pages/admin/AdminCatalog'));
const GodownBrowser = lazy(() => import('./pages/GodownBrowser'));

// Global Badge Updater Component
const AppBadgeUpdater = () => {
  const { data: unreadNotifs = 0 } = useUnreadNotifications();
  const { data: unreadChats = 0 } = useUnreadChats();

  useEffect(() => {
    const totalUnread = unreadNotifs + unreadChats;
    if ('setAppBadge' in navigator) {
      if (totalUnread > 0) {
        navigator.setAppBadge(totalUnread).catch(console.error);
      } else {
        navigator.clearAppBadge().catch(console.error);
      }
    }
  }, [unreadNotifs, unreadChats]);

  return null;
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });
  const location = useLocation();

  const handleSplashFinish = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  const queryClient = useQueryClient();

  useEffect(() => {
    // onMessageListener ab ek unsubscribe function return karta hai
    const unsubscribe = onMessageListener((payload) => {
      console.log('[App.jsx] Received foreground message ', payload);
      toast.info(`${payload.notification?.title}: ${payload.notification?.body}`);

      // Zero-API real-time UI update for notifications
      queryClient.setQueryData(['unreadCount'], (old) => (old ? old + 1 : 1));
      
      // Attempt to increment chat unread count if title contains 'Message'
      if (payload.notification?.title?.toLowerCase().includes('message')) {
        queryClient.setQueryData(['unreadChatCount'], (old) => (old ? old + 1 : 1));
      }

      // Automatic invalidation for order updates
      if (payload.notification?.title?.toLowerCase().includes('order')) {
        queryClient.invalidateQueries({ queryKey: ['liveOrderCount'] });
      }
    });

    // Cleanup listener when App unmounts
    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  // Determine if we should show the global customer layout
  const isDashboardRoute = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');

  return (
    <>
      <AppBadgeUpdater />
      <InstallPWA />
      <PermissionPrompter />
      <ScrollToTop />
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      {!isDashboardRoute ? (
        // CUSTOMER FACING LAYOUT
        <div className="min-h-screen bg-gray-50 font-sans">
          <div className="max-w-4xl mx-auto p-4 pb-20">
            <Suspense fallback={
              <div className="fixed inset-0 z-[9999] bg-[#fdfaf3] flex flex-col items-center justify-center h-screen w-screen">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="absolute w-16 h-16 rounded-full bg-yellow-400 opacity-30 animate-ping"></div>
                  <div className="absolute w-12 h-12 rounded-full bg-yellow-500 opacity-40 animate-pulse"></div>
                  <div className="z-10 text-4xl animate-bounce" style={{ animationDuration: '1s' }}>🛍️</div>
                </div>
                <div className="text-yellow-600 font-black tracking-[0.2em] text-xs animate-pulse">LOADING</div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop/:id" element={<ShopDetail />} />
                <Route path="/shop/:shopId/product/:productId" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/orders" element={<CustomerOrders />} />
                <Route path="/profile/settings" element={<CustomerSettings />} />
                <Route path="/profile/wishlist" element={<Wishlist />} />
                <Route path="/profile/vendor-request" element={<VendorRequestForm />} />
                <Route path="/search" element={<Search />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/all-stores" element={<AllStores />} />
                <Route path="/daily-market" element={<DailyMarket />} />
                <Route path="/daily-market/post" element={<DailyMarketPost />} />
                <Route path="/daily-market/item/:id" element={<DailyMarketItemDetail />} />
                <Route path="/chat" element={<ChatInbox />} />
                <Route path="/chat/:sessionId" element={<ChatScreen />} />
              </Routes>
            </Suspense>
          </div>
          <BottomNav />
        </div>
      ) : (
        // DASHBOARD LAYOUT (Full width, no global Navbar)
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-screen bg-[#fdfaf3]">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute w-16 h-16 rounded-full bg-yellow-400 opacity-30 animate-ping"></div>
              <div className="absolute w-12 h-12 rounded-full bg-yellow-500 opacity-40 animate-pulse"></div>
              <div className="z-10 text-4xl animate-bounce" style={{ animationDuration: '1s' }}>🛍️</div>
            </div>
            <div className="text-yellow-600 font-black tracking-[0.2em] text-xs animate-pulse">LOADING</div>
          </div>
        }>
          <Routes>
            {/* Vendor Full Screen Pages */}
            <Route path="/vendor" element={<VendorHub />} />
            <Route path="/vendor/orders" element={<VendorOrders />} />
            <Route path="/vendor/menu" element={<VendorMenu />} />
            <Route path="/vendor/godown" element={<GodownBrowser />} />

            {/* KEEP OLD ROUTES AS REDIRECTS TEMPORARILY */}
            <Route path="/vendor-dashboard" element={<Navigate to="/vendor" replace />} />
            <Route path="/vendor-godown" element={<Navigate to="/vendor/godown" replace />} />

            <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminHub />} />
            <Route path="/admin/live-orders" element={<AdminLiveOrders />} />
            <Route path="/admin/onboard" element={<AdminOnboard />} />
            <Route path="/admin/shops" element={<AdminShops />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/godown" element={<AdminGodown />} />
            <Route path="/admin/approvals" element={<AdminApprovals />} />
            <Route path="/admin/vendor-requests" element={<AdminVendorRequests />} />
            <Route path="/admin/broadcast" element={<AdminBroadcast />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/catalog/:shopId" element={<AdminCatalog />} />
          </Routes>
        </Suspense>
      )}
    </>
  );
};

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      <AppContent />
    </Router>
  );
}

export default App;
