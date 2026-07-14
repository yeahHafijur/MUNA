# 🧠 MUNA Project Brain (Context & Status)

> **For any AI Assistant:** Read this file carefully to understand the exact context, architecture, history, and future goals of the MUNA app before making any changes. This project has a specific history regarding PWA vs Native apps.

---

## 1. 🏗️ Project Architecture & Context

**MUNA** is a hyper-local quick-commerce delivery app (similar to Blinkit, Zepto, or Swiggy Instamart). 

- **Backend:** Node.js, Express, MongoDB (Currently hosted on Render at `https://www.munahut.in`).
- **Web App (PWA):** A PWA wrapper (TWA) was originally launched on the Play Store (`app.vercel.muna_opal.twa`) but suffered from severe background Location and Push Notification issues.
- **Native App (`muna-app`):** This is the ultimate replacement for the TWA. **CRITICAL CONTEXT:** This single React Native app houses both the **Customer App** and the **Vendor Dashboard** (`src/app/vendor/`).
- **Admin Panel:** NOT BUILT YET. Currently, there is no Admin Panel to manage global operations. This is a future requirement.

### 🤔 Why did we build a Native App if a PWA already exists?
The PWA was wrapped as a TWA (Trusted Web Activity) and published to the Play Store (`app.vercel.muna_opal.twa`). However, the PWA faced severe limitations with **Push Notifications** and **Native GPS Location tracking**. 
This React Native Expo app was built specifically to replace the TWA on the Play Store to provide a flawless, premium native experience with working notifications and location.

---

## 2. ✨ What Has Been Completed So Far (React Native App)

The `muna-app` has been heavily customized to feel like a premium, top-tier delivery app.

*   **Auth & Profiles:**
    *   Google Sign-In integrated.
    *   Premium Dark-themed User Profile and Settings page.
    *   Phone number and Name update flow.
*   **Location & Cart (The core fix):**
    *   Native GPS integration using `expo-location`.
    *   Users can fetch GPS, add "House No.", and save addresses as Home/Office/Other.
    *   Added fallback "Use Once" functionality for guests/quick orders.
*   **Premium Homepage UI:**
    *   **Sticky Search Bar:** Stays at the top while scrolling.
    *   **Curated Collections:** Thematic product rows (e.g., "Breakfast Essentials 🍳", "Snacks 🍿").
    *   **Active Order Tracker:** A pulsating banner at the top if the user has an ongoing order (`GET /api/orders/active`).
    *   **Floating Cart Strip:** A sticky bottom strip showing items and price when cart is not empty.
*   **Product Cards:**
    *   Redesigned to be highly minimalist (removed bulky discount badges, cleaned up text, focused on product and price).

*   **Vendor Features & Stability:**
    *   Vendor Dashboard UI improved (large Dashboard button added to Profile).
    *   Fixed deep crashes related to NativeWind and React Navigation by removing dynamic classes that used CSS variables incorrectly.
    *   Replaced native `toLocaleDateString` and `toLocaleTimeString` with robust manual formatters across the entire app (`utils/format.ts`) to completely eliminate Hermes JS Engine crashes on Android. Eliminated all inline URL formatting duplicates.
    *   Implemented a background background alarm (`useVendorAlarm`) for new incoming orders, even playing a loud ringtone.
    *   Order History tab for Vendors is fully functional with date pickers.

---

## 3. 🚀 Pending Tasks (Road to Production)

Since this app will act as an **update** to the existing TWA on the Play Store, the production steps are highly specific.

*   [x] **Login System Production Cleanup:** Removed any remaining "Demo Login" or mock vendor buttons from `login.tsx` before release (Verified clean).
*   [ ] **Admin Panel Creation:** A global admin panel has not been built yet. It needs to be created (either as a web dashboard or a hidden super-admin route in the app) to manage users, vendors, and platform operations.

### Recommended Features (Post-Audit Additions)
*   [ ] **Address Manager:** Currently, "Saved Addresses" in the profile is just a placeholder. Need a dedicated screen (`/settings/addresses`) to manage saved locations.
*   [ ] **Payment Gateway Integration:** (Optional) The app is currently Cash On Delivery (COD) only. If Razorpay is needed, it must be integrated via `react-native-razorpay` and backend order verification.

### C. App Configuration & Keystore (Crucial)
*   [ ] **Keystore Recovery:** The new Expo EAS build MUST be signed with the exact same `.jks` (Upload Key) used for the original PWA/TWA (`app.vercel.muna_opal.twa`). Without this, Google Play will reject the update.
*   [ ] **Package Verification:** Ensure `app.json` package name (`app.vercel.muna_opal.twa`) and `versionCode` (currently `27`) are correctly incremented for the Play Store update.
*   [ ] **Branding:** Set final App Icon and Splash screen images in `app.json`.

### B. Push Notifications Validation
*   [x] FCM Tokens are currently being generated and saved to the backend via `saveFcmToken`.
*   [x] **Action Required:** Test a live push notification from the backend to the physical device to ensure background notifications work perfectly (this was the main reason for switching to Native). **(Verified by User via USB Debugging)**

### E. Build & Submission
*   [ ] **EAS Build:** Run `eas build -p android --profile production` once the keystore is linked.
*   [ ] **Privacy Policy:** Ensure the privacy policy link on the Play Store is updated to reflect the new Native App's background location usage.
*   [ ] **Crash Reporting (Sentry):** To fully activate Sentry for production, you need a DSN from a Sentry.io project. Sentry is configured to look for `EXPO_PUBLIC_SENTRY_DSN`. Either add a `.env` file containing `EXPO_PUBLIC_SENTRY_DSN="your-sentry-dsn-here"`, or pass it as an environment variable in EAS before building!

---

## 4. 🗂️ Key Files Guide for AI

If you need to make changes, look here first:
*   `src/app/(tabs)/index.tsx`: The main homepage (Sticky Search, Order Tracker, Banners, Collections).
*   `src/components/cart/CartLocation.tsx`: Handles all GPS and Address saving logic.
*   `src/app/vendor/`: The entire Vendor flow (Godown, Menu, Orders). *Needs finishing touches*.
*   `src/api/api.js`: Axios instance pointing to the production backend (`https://www.munahut.in`).
*   `src/components/ProductCard.tsx`: The universal minimalist product card.
*   `backend/controllers/authController.js`: Handles Google Auth, saving locations, and FCM tokens. 

> **Note to AI:** When continuing work, check section 3 (Pending Tasks). The immediate focus should be finishing the **Vendor Flow**, creating the **Admin Panel**, or doing the **Keystore/Production setup**. Ask the user what they want to tackle first.
