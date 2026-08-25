# 🧠 MUNA Project Brain

> **For any AI assistant:** read this before touching code. Last verified **2026-08-22** against commit `9a89e99`.
>
> **Rule:** this file drifts. If a status claim here contradicts the code, **trust the code** and fix this file in the same PR.

---

## 1. What MUNA is

A hyper-local quick-commerce + neighbourhood marketplace for small-town India (Blinkit/Zepto model, but for `apne gaon ki har dukan`). Vendors are real local shopkeepers onboarded by an admin. Delivery is done by the shop itself, confirmed by a 4-digit PIN. **Cash on Delivery only — no payment gateway.**

Two secondary ideas layered on top of plain commerce:
- **Godown** — a global master catalog (`MasterProduct`) that vendors import from, so 50 shops don't each type "Amul Butter 100g" differently.
- **Live Bazar / Daily Market** — anyone nearby can post a perishable item for sale (geo-scoped, auto-expiring), with buyer↔seller chat.

---

## 2. Repo layout — three surfaces, one backend

| Folder | Stack | Ships as | Contains |
|---|---|---|---|
| `backend/` | Express 5, Mongoose 9, socket.io 4 | Render → `muna-5o5g.onrender.com`, fronted by `munahut.in` / `munastore.in` | 17 route groups, 16 controllers, 15 models |
| `frontend/` | Vite 8, React 19, Tailwind 4, TanStack Query, vite-plugin-pwa | Vercel PWA | Customer + Vendor + **the whole Admin panel** |
| `muna-app/` | Expo ~55, RN 0.83, expo-router, NativeWind 4 | Play Store AAB | Customer + Vendor **only — no admin screens** |

`frontend/vercel.json` rewrites `/api/*` and `/uploads/*` to the Render backend, so the web app uses **relative** API paths. The RN app uses an absolute base URL from `app.json` → `extra.apiUrl`.

### Why a native app when a PWA already exists?
The PWA was wrapped as a TWA and published as `app.vercel.muna_opal.twa`. Background **push notifications** and **native GPS** were broken in the TWA. `muna-app` is the *in-place update* to that same Play Store listing — which is why the Android package name stays `app.vercel.muna_opal.twa` and must never be renamed.

The web PWA is **not** deprecated — it is still the only place the admin console lives, and it is what `munastore.in` serves.

---

## 3. Data model

15 Mongoose models in `backend/models/`.

**Core commerce**
- `User` — roles `customer | vendor | super_admin`; embeds `savedLocations[]`, `fcmTokens[]`, `wishlist[]`, and `tokenVersion` (JWT revocation counter).
- `Shop` — one per vendor (`vendorId`). Holds `deliverySettings` (min order, base charge, per-km charge, `maxRange`), `autoSchedule` (open/close times + timezone), and a `2dsphere` `location`.
- `Product` — belongs to a `shopId`. `category` is `Mixed` (legacy string **or** ObjectId — see gotchas). Has `inStock`, `isHidden`, `salesCount`, `approvalStatus`.
- `Order` — snapshots `items[]` (name + price at order time), `deliveryLocation`, `deliveryFee`, a required `deliveryOtp`, and brute-force fields `otpAttempts` / `otpLockedUntil`.

**Catalog**
- `MasterProduct` — the Godown. Global items with `status: pending | approved`.
- `ItemCategory` — hybrid: `isGlobal: true` rows are platform-wide, otherwise scoped by `shopId` + `vendorId`. Unique on `(name, shopId)`.
- `ShopCategory` — the shop-type taxonomy shown on the homepage (Grocery, Medical, …).

**Marketplace & comms**
- `LiveBazarItem` — `2dsphere` index for nearby lookups **and** a TTL index on `expiresAt` so listings delete themselves.
- `ChatSession` / `ChatMessage` — unique per `(buyerId, sellerId, itemId)`.
- `Notification` — the in-app inbox; written alongside every FCM push.
- `VendorRequest` — a user's application to become a vendor (full shop onboarding details + photo).
- `Banner` — homepage promos, `position: top | mid`.
- `Settings` — generic key/value bag. Two keys in use: `navbarMessage` (a 2-line homepage tagline) and `featuredItems` (an ordered array of `MasterProduct` IDs for the homepage carousel).
- `AuditLog` — admin actions on a shop's catalog.

---

## 4. Auth & roles

Google Sign-In only (no password field anywhere). `POST /api/auth/google-login` verifies the Google ID token server-side via `google-auth-library`, then issues a 7-day JWT carrying `{ id, role, tv }`.

- **Web** stores it as an `httpOnly`, `sameSite: strict` cookie.
- **RN app** stores it in `expo-secure-store` and sends `Authorization: Bearer …` (`muna-app/src/api/api.ts`).
- **Revocation:** `protect` rejects any token whose `tv` ≠ the user's current `tokenVersion`. Logout and account deletion bump `tokenVersion`, so stolen tokens die immediately.
- **socket.io** does the same JWT + `tv` check in a handshake middleware, then authorizes every `join_room` / `mark_as_read` against `ChatSession` membership.

`authorize(...roles)` in `backend/middleware/authMiddleware.js` gates by role. Vendor endpoints additionally re-derive the shop from `vendorId` rather than trusting a client-supplied `shopId`.

---

## 5. What actually ships today

### Customer (web + app)
Homepage with sticky search, banners, shop-by-category, quick-delivery stores, bestsellers, curated collections, and an active-order tracker. Shop pages, product detail, wishlist, global search, cart with GPS address picker + saved addresses (Home/Office/Other) + 1-tap quick GPS, order placement with instructions, order history, notification inbox, privacy policy, onboarding slides (app only).

### Vendor (web + app)
Hub/dashboard, order queue with status transitions and the delivery-PIN prompt, order history with date filters + search, menu/catalog CRUD, category management with reorder, Godown import (single + multi), shop settings (delivery pricing, auto open/close), Call Customer button. The RN app adds `useVendorAlarm` — a loud ringtone on the `new-orders-v2` Android channel for incoming orders.

### Admin (web only — `/admin`)
`AdminHub` is a hub-and-spoke console with live stats. Spokes: Live Order Monitor, Onboard Vendor, Vendor Requests, Manage Shops (edit + delete), Categories, Master Godown, Approvals, Broadcast Notification, App Settings, Manage Banners, per-shop Catalog editor.

### Order lifecycle
`pending → accepted → preparing → out_for_delivery → delivered`. `cancelled` is reachable from `pending`, `accepted`, and `preparing` **only** — once an order is `out_for_delivery` it can only go to `delivered`. Transitions are validated server-side against an explicit `validTransitions` map. Customers may only self-cancel while `pending`.

`placeOrder` (`backend/controllers/orderController.js`) is the most safety-critical function in the repo. In one Mongo transaction it: re-reads every product from the DB and **recomputes the price** (client totals are never trusted), rejects mixed-shop carts, rejects out-of-stock items, rejects closed shops, computes distance via `$geoNear` and rejects out-of-range delivery, enforces `minOrderAmount`, derives the delivery fee, and generates the 4-digit `deliveryOtp` with `crypto.randomInt`.

Delivery handover: the vendor must enter the customer's PIN to mark `delivered`. The PIN is compared with `crypto.timingSafeEqual`, is `select`-excluded from every vendor-facing response, and locks for 15 minutes after 5 wrong attempts. On success, `salesCount` is bulk-incremented per product.

### Notifications
`backend/utils/notificationService.js` — `sendAndSaveNotification()` fires an FCM multicast (batched at 500 tokens) **and** writes a `Notification` row, fire-and-forget so it never blocks a response. Dead tokens are `$pull`ed from the user on `messaging/registration-token-not-registered`. The RN app routes taps via the push `data.route` field.

### Cron
`backend/index.js` runs a per-minute `node-cron` job that flips `shop.isOpen` for every shop with `autoSchedule.enabled`, using `moment-timezone` and handling overnight windows (`openTime > closeTime`).

---

## 6. Security posture (already hardened — don't regress these)

Commit `19118bc` was a dedicated hardening pass. Before "simplifying" any of the following, understand why it exists:

- **Server-side price recomputation** in `placeOrder`; hard caps of 50 items/order and 50 qty/item.
- **Delivery PIN** never leaves the server toward a vendor; timing-safe compare; 5-attempt lockout.
- **JWT revocation** via `tokenVersion` on both HTTP and socket paths.
- **CORS allowlist** shared by Express and socket.io; Vercel preview domains are off unless `ALLOW_VERCEL_PREVIEWS=true`.
- **Helmet** with `default-src 'none'`, `frame-ancestors 'none'`, and 2-year HSTS preload.
- **Rate limits:** 200 req/15min global, 10/15min on `/api/auth`, 20/15min on order placement, 60/15min on status updates.
- **Upload validation** (`backend/middleware/uploadMiddleware.js`): 5 MB cap, MIME filter, **plus** magic-byte sniffing after multer. SVG is deliberately rejected to avoid stored XSS.
- **ReDoS guard:** vendor order search escapes regex metacharacters and caps query length at 100.
- **Pagination** clamped to max 100 per page; admin order feed hard-capped at 500 rows.
- **Cache-Control** is explicitly `no-store` for `/api/orders` and `/api/shops/my-shop`.
- Socket rooms are membership-checked; `maxHttpBufferSize` is 1 MB.

---

## 7. Environment variables

`backend/.env` (local) / Render dashboard (prod):

| Var | Notes |
|---|---|
| `MONGO_URI`, `JWT_SECRET`, `PORT` | required |
| `GOOGLE_CLIENT_ID` | **required for login** — must be set in prod; missing from the local `.env` |
| `FIREBASE_SERVICE_ACCOUNT` | full service-account JSON as a string; falls back to `backend/serviceAccountKey.json` locally. Missing ⇒ push silently disabled |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | image hosting |
| `FRONTEND_URL`, `NODE_ENV`, `ALLOW_VERCEL_PREVIEWS` | CORS + cookie `secure` flag |
| `VAPID_*`, `ONESIGNAL_*` | legacy web-push era; FCM replaced these |

`frontend/.env`: `VITE_GOOGLE_CLIENT_ID`.
`muna-app`: `EXPO_PUBLIC_SENTRY_DSN` (optional; Sentry is wired in `src/app/_layout.tsx` and disabled in dev). Google client ID and API URL live in `app.json` → `extra`.

---

## 8. Gaps & pending work

**Verified done** (these were listed as pending in the old version of this file and are now shipped): admin panel, saved-address manager, demo-login removal, FCM tokens + live push tested on device, Sentry wiring, keystore present locally (`muna-app/credentials.json` → `@yeahhafijurs-team__muna.jks`, both gitignored).

**Open:**

- [ ] **No tests anywhere.** Zero test files across all three packages, no runner configured. `placeOrder`, `updateOrderStatus`, and the delivery-PIN flow are the highest-value first targets.
- [ ] **`AGENTS.md` version conflict** — `muna-app/AGENTS.md` says to read the Expo **v57** docs, but `package.json` pins Expo **~55.0.28**. Fix the doc or do the upgrade; right now it silently sends agents to the wrong API reference.
- [ ] **Duplicated Android permissions** in `app.json` — `RECORD_AUDIO`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` are each listed twice. Harmless but sloppy; also `RECORD_AUDIO` looks unused, verify before shipping (Play Store asks about it).
- [ ] **Background location** is claimed in the store listing rationale but only `locationWhenInUsePermission` is configured. Either add background location properly or make sure the privacy policy and Play declaration match "while in use".
- [ ] **Play Store release** — bump `versionCode` (currently **29**, app version **2.0.0**), then `eas build -p android --profile production`. Signing must use the original upload key or Google rejects the update.
- [ ] **Stale PWA manifest** — `frontend/vite.config.js` `related_applications` points at `com.muna.app`, but the real package is `app.vercel.muna_opal.twa`. The vendor shortcut also targets the retired `/vendor-dashboard` route.
- [ ] **Two brand domains** (`munastore.in` and `munahut.in`) are both live in the CORS list, and the sitemap hardcodes `munastore.in`. Decide on one canonical domain.
- [ ] **Dev scripts in `backend/` root** — `check.js`, `fix.js`, `delete_items.js`, `remove_orders.js` etc. sit next to `index.js`. Move to `backend/scripts/` (which already exists) or delete; `delete_items.js` / `remove_orders.js` are destructive and shouldn't be one typo away from prod.
- [ ] **Payment gateway** — still COD only. Razorpay would need `react-native-razorpay` + server-side signature verification before `Order.paymentStatus` can mean anything.
- [ ] **Admin on mobile** — admins currently must use the web app. Decide whether that's permanent or whether a hidden super-admin route belongs in `muna-app`.

---

## 9. Key files

**Backend**
- `index.js` — CORS allowlist, helmet/CSP, rate limiters, socket.io auth, route mounting, the shop-schedule cron, graceful shutdown. Everything global lives here.
- `controllers/orderController.js` — order lifecycle, price recomputation, delivery-PIN verification. Read this before touching orders.
- `controllers/authController.js` — Google login, saved locations, FCM token save, profile update, account deletion.
- `middleware/authMiddleware.js` — `protect` + `authorize`.
- `utils/notificationService.js` — the only correct way to send a notification.
- `utils/geo.js` — distance helpers.

**Web (`frontend/src/`)**
- `App.jsx` — all routes; splits customer layout vs full-screen dashboard layout on the `/vendor` / `/admin` prefix.
- `pages/admin/AdminHub.jsx` — the admin console entry point and the map of every admin capability.
- `context/AuthContext.jsx`, `context/CartContext.jsx` — global state.
- `pages/Cart.jsx` + `components/cart/CartLocation.jsx` — checkout and GPS/address logic.

**App (`muna-app/src/`)**
- `app/_layout.tsx` — providers, Sentry, notification channel + tap routing, splash gating, and the auth redirect guard.
- `api/api.ts` — axios instance, SecureStore token injection, 401 cleanup.
- `app/(tabs)/index.tsx` — homepage.
- `app/vendor/` — the vendor flow (index, orders, menu, godown).
- `hooks/useVendorAlarm.ts` — the incoming-order ringtone.
- `utils/format.ts` — **use these formatters**, see gotchas.

---

## 10. Conventions & gotchas

1. **Never rename the Android package.** `app.vercel.muna_opal.twa` is what makes this an update to the existing Play Store listing instead of a new app.
2. **No `toLocaleDateString` / `toLocaleTimeString` in `muna-app`.** They crash on Hermes/Android. Always use `muna-app/src/utils/format.ts`.
3. **NativeWind:** don't put CSS variables inside dynamic `className` strings — that caused deep RN/navigation crashes before. Build full static class strings.
4. **`Product.category` is `Mixed`** — some rows hold a legacy category *string*, newer rows hold an `ItemCategory` ObjectId. Handle both when querying or rendering.
5. **Categories are hybrid:** a shop's category list = global (`isGlobal: true`) + its own (`shopId`). A regression here has already been fixed once (`d545fb2`) — keep both halves.
6. **Web uses cookies, app uses Bearer.** Web `fetch` calls need `credentials: 'include'`; the app relies on the axios interceptor. Anything new must work on both.
7. **Web API paths are relative** (`/api/...`) because Vercel proxies them. Don't hardcode the Render URL in `frontend/`.
8. **Comments and commit messages are Hinglish.** Match the surrounding style rather than rewriting existing comments into English.
9. **Response shapes are inconsistent.** Order list endpoints return `{ orders, pagination }`; the admin order feed returns a bare array. This has already caused one production bug (`9a89e99`) — check the controller before parsing.
10. **`git status` is clean and `master` is the main branch.** Don't commit unless asked.

---

> **Where to start:** section 8. The two cheapest high-value items are fixing the `AGENTS.md` Expo version conflict and adding a first test around `placeOrder`. The biggest real decision pending is the canonical domain and the Play Store release. Ask the user which one they want.

