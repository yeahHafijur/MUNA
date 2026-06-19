import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
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

  // Determine if we should show the global customer layout (Navbar + max-w container)
  const isDashboardRoute = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      {!isDashboardRoute ? (
        // CUSTOMER FACING LAYOUT
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navbar />
          <div className="max-w-4xl mx-auto p-4 pb-20">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
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
        </div>
      ) : (
        // DASHBOARD LAYOUT (Full width, no global Navbar)
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
          <Routes>
            <Route path="/vendor" element={<VendorLayout />}>
              <Route index element={<VendorHome />} />
              <Route path="orders" element={<VendorOrders />} />
              <Route path="menu" element={<VendorMenu />} />
              <Route path="settings" element={<VendorSettings />} />
              <Route path="godown" element={<GodownBrowser />} />
            </Route>

            {/* KEEP OLD ROUTES AS REDIRECTS OR FALLBACKS TEMPORARILY */}
            <Route path="/vendor-dashboard" element={<VendorLayout />} />
            <Route path="/vendor-godown" element={<GodownBrowser />} />

            <Route path="/admin-dashboard" element={<AdminDashboard />} />
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
