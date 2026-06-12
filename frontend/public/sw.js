importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkOnly, CacheFirst } from 'workbox-strategies';

// Precache the manifest (vite-plugin-pwa will inject the files here)
precacheAndRoute(self.__WB_MANIFEST || []);

const OFFLINE_PAGE = '/offline.html';

// Explicitly cache offline.html on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-cache').then((cache) => {
      return cache.add(OFFLINE_PAGE);
    })
  );
});

// Cache image files
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
  })
);

// Fallback to offline.html for navigation requests
const networkOnly = new NetworkOnly();
registerRoute(
  new NavigationRoute(async (params) => {
    try {
      return await networkOnly.handle(params);
    } catch (error) {
      const cache = await caches.open('offline-cache');
      return await cache.match(OFFLINE_PAGE);
    }
  })
);

self.addEventListener('activate', (event) => {
  // Let the browser handle claiming clients naturally
});
