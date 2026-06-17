import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SplashScreen from './components/SplashScreen';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import ShopDetail from './pages/ShopDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Profile from './pages/Profile';
import VendorLayout from './pages/vendor/VendorLayout';
import VendorHome from './pages/vendor/VendorHome';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorMenu from './pages/vendor/VendorMenu';
import VendorSettings from './pages/vendor/VendorSettings';
import AdminDashboard from './pages/AdminDashboard';
import GodownBrowser from './pages/GodownBrowser';
import Search from './pages/Search';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Notifications from './pages/Notifications';
import { onMessageListener } from './firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
          </div>
        </div>
      ) : (
        // DASHBOARD LAYOUT (Full width, no global Navbar)
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
