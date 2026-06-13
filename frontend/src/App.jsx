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

  // Initialize OneSignal
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.init({
        appId: "f7ec7ea5-0da8-4703-b112-26e3707c3da1",
        notifyButton: {
          enable: false,
        },
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: '/sw.js',
      });

      console.log("[MUNA] OneSignal initialized successfully");

      // Function to sync player ID to backend
      const syncPlayerId = async (source) => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            console.log("[MUNA] No auth token found, skipping player ID sync");
            return;
          }

          const sub = OneSignal.User.PushSubscription;
          const playerId = sub.id;
          const optedIn = sub.optedIn;

          console.log(`[MUNA] Sync attempt from: ${source}`);
          console.log(`[MUNA] Player ID: ${playerId}`);
          console.log(`[MUNA] Opted In: ${optedIn}`);

          if (!playerId) {
            console.log("[MUNA] No Player ID yet, will retry...");
            return;
          }

          const res = await fetch('/api/auth/save-player-id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ playerId })
          });
          const data = await res.json();
          console.log("[MUNA] Player ID sync response:", data);
        } catch (err) {
          console.error("[MUNA] Failed to sync Player ID:", err);
        }
      };

      // Listen for subscription changes
      OneSignal.User.PushSubscription.addEventListener("change", (event) => {
        console.log("[MUNA] PushSubscription changed:", event);
        syncPlayerId("subscription-change-event");
      });

      // Try immediately
      syncPlayerId("initial");

      // Retry after 3 seconds (subscription may take a moment)
      setTimeout(() => syncPlayerId("retry-3s"), 3000);
      // Retry after 8 seconds
      setTimeout(() => syncPlayerId("retry-8s"), 8000);
    });
  }, []);

  return (
    <Router>
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


            {/* Aage chal kar hum yahan Shop aur Cart ke routes add karenge */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
