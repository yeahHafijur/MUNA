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

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Initialize OneSignal
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.init({
        appId: "f7ec7ea5-0da8-4703-b112-26e3707c3da1",
        notifyButton: {
          enable: true,
        },
      });

      // Send player ID to backend if user is logged in
      const syncPlayerId = () => {
        const token = localStorage.getItem('token');
        const playerId = OneSignal.User.PushSubscription.id;
        if (token && playerId) {
          fetch('/api/auth/save-player-id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ playerId })
          }).catch(err => console.error("Failed to sync Player ID", err));
        }
      };

      OneSignal.User.PushSubscription.addEventListener("change", syncPlayerId);
      syncPlayerId();
    });
  }, []);

  return (
    <Router>
      <ScrollToTop />
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
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


            {/* Aage chal kar hum yahan Shop aur Cart ke routes add karenge */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
