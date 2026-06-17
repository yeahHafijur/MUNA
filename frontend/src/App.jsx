import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SplashScreen from './components/SplashScreen';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import ShopDetail from './pages/ShopDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Profile from './pages/Profile';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GodownBrowser from './pages/GodownBrowser';
import Search from './pages/Search';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Notifications from './pages/Notifications';
import { onMessageListener } from '../firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash screen once per session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });

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

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      <ScrollToTop />
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Ye humara Top Header (Navbar) hoga */}
        <Navbar />

        {/* Yahan par humare alag-alag pages render honge */}
        <div className="max-w-4xl mx-auto p-4 pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop/:id" element={<ShopDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
            <Route path="/vendor-godown" element={<GodownBrowser />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* Aage chal kar hum yahan Shop aur Cart ke routes add karenge */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
