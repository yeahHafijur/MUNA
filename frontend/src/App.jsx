import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import ScrollToTop from './components/ScrollToTop';
import { onMessageListener } from './firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const ShopDetail = lazy(() => import('./pages/ShopDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const Search = lazy(() => import('./pages/Search'));
const Notifications = lazy(() => import('./pages/Notifications'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

// Vendor Pages
const VendorLayout = lazy(() => import('./pages/vendor/VendorLayout'));
const VendorHome = lazy(() => import('./pages/vendor/VendorHome'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorMenu = lazy(() => import('./pages/vendor/VendorMenu'));
const VendorSettings = lazy(() => import('./pages/vendor/VendorSettings'));

// Admin & Others
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const GodownBrowser = lazy(() => import('./pages/GodownBrowser'));

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

  useEffect(() => {
    onMessageListener()
      .then((payload) => {
        console.log('[App.jsx] Received foreground message ', payload);
        toast.info(`${payload.notification.title}: ${payload.notification.body}`);
      })
      .catch((err) => console.log('failed: ', err));
  }, []);

  // Determine if we should show the global customer layout
  const isDashboardRoute = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');

  return (
    <>
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
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/search" element={<Search />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
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
            <Route path="/vendor" element={<VendorLayout />}>
              <Route index element={<VendorHome />} />
              <Route path="orders" element={<VendorOrders />} />
              <Route path="menu" element={<VendorMenu />} />
              <Route path="settings" element={<VendorSettings />} />
            </Route>
            
            {/* Godown standalone full page route */}
            <Route path="/vendor/godown" element={<GodownBrowser />} />

            {/* KEEP OLD ROUTES AS REDIRECTS TEMPORARILY */}
            <Route path="/vendor-dashboard" element={<Navigate to="/vendor" replace />} />
            <Route path="/vendor-godown" element={<Navigate to="/vendor/godown" replace />} />

            <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminDashboard />} />
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
