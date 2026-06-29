import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { get, set, del } from 'idb-keyval';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "739956516947-brhvingmj39r4ttur0rj1bvd354hmus9.apps.googleusercontent.com";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// IndexedDB Persister Configuration
const indexedDBPersister = {
  persistClient: async (client) => {
    await set('react-query-cache', client);
  },
  restoreClient: async () => {
    return await get('react-query-cache');
  },
  removeClient: async () => {
    await del('react-query-cache');
  },
};

if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW();
  }).catch(() => {});
}

createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: indexedDBPersister }}
          >
            <App />
          </PersistQueryClientProvider>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>,
)
