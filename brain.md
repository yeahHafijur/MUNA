# 🧠 MUNA - Project Brain

Welcome to the **MUNA** project! This document serves as the central knowledge base for the project architecture, features, and workflows.

## 🚀 Overview
**MUNA** is a multi-vendor e-commerce and delivery platform. It connects customers with local shops (Grocery, Kirana, Bakery, Pharmacy, etc.) for quick and easy delivery. The platform consists of a frontend Progressive Web App (PWA) built with React/Vite, and a backend REST API powered by Node.js, Express, and MongoDB.

---

## 🏗️ Tech Stack

### Frontend (`/frontend`)
- **Framework:** React 19 + Vite
- **Styling:** Vanilla CSS + TailwindCSS (v4)
- **State Management & Data Fetching:** React Query (`@tanstack/react-query`)
- **Routing:** React Router v7
- **PWA / Offline Support:** Vite PWA Plugin + Workbox
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Authentication:** Google OAuth (`@react-oauth/google`)

### Backend (`/backend`)
- **Runtime:** Node.js
- **Framework:** Express.js 5
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens)
- **Image Storage:** Cloudinary
- **Notifications:** Firebase Admin SDK (FCM)
- **Scheduling:** `node-cron` (used for shop auto-open/close states)

---

## 👥 User Roles

1. **User (Customer):** Can browse shops, search for products, add items to cart, and place orders.
2. **Vendor (Shop Owner):** Manages a specific shop. Can import items from the central Godown, create custom products, manage shop orders, and toggle shop open/close status.
3. **Super Admin:** The platform owner. Can onboard new vendors, manage global categories, manage the Godown inventory, and oversee all platform activity.

---

## 🗄️ Core Database Models

### 1. `User`
Stores all registered users. Role field dictates permissions (`user`, `vendor`, `super_admin`). Auth is handled via Firebase/Google OAuth.

### 2. `Shop`
Represents a vendor's store.
- Linked to a `vendorId` (User).
- Belongs to a strict `shopCategoryId` (e.g., "Grocery", "Pharmacy").
- Contains geolocation (`location`), schedule settings (`autoSchedule`), and current status (`isOpen`, `isActive`).

### 3. Categories (Hybrid Taxonomy)
The category system uses two tiers to maintain structure while allowing vendor flexibility:
- **`ShopCategory`:** Strict global categories for classifying shops (Superadmin only). Used in the Vendor Onboarding flow.
- **`ItemCategory`:** Hybrid categories for classifying products inside shops.
  - **Global (`isGlobal: true`):** Created by Superadmin, visible to ALL vendors (e.g., "Beverages", "Dairy").
  - **Custom (`isGlobal: false`):** Created by a Vendor, tied strictly to their `vendorId` and `shopId`.

### 4. `Product`
An item sold by a vendor.
- Tied to a `shopId` and `vendorId`.
- References an `ItemCategory`.
- Tracks `inStock` status.

### 5. `GodownItem`
A centralized master inventory list managed by the Super Admin. Vendors can easily "import" items from the Godown directly into their shop's product list.

### 6. `Order`
Tracks customer purchases.
- Tied to `userId` (customer) and `shopId` (vendor).
- Tracks `status` (pending, accepted, rejected, completed).

---

## 🛠️ Key Workflows

### Vendor Onboarding Flow
1. Super Admin goes to `/admin` -> **Onboard Tab**.
2. Admin enters vendor details (Name, Email, Phone) and Shop details (Name, Address, Lat/Lng).
3. Admin selects a **Shop Category** from the strict list.
4. Backend creates the `User` (with role `vendor`) and the `Shop` linked to that user.

### Item Categorization Flow
1. Super Admin creates **Global Item Categories** (e.g., Snacks, Dairy).
2. Vendor goes to their catalog. The category dropdown shows both Global categories (marked with 🌐) and any custom categories they've made.
3. If a vendor needs a specific category not provided globally (e.g., "Diwali Special Offer"), they can create a **Custom Item Category**.

### Push Notifications
1. When a user logs in, the React app requests Notification permission from the browser.
2. If granted, an FCM token is generated and sent to the backend (`/api/auth/save-fcm-token`).
3. When an order is placed, the backend uses `firebase-admin` to send a push notification to the specific vendor's FCM tokens.

---

## 📁 Directory Structure Overview

```text
MUNA/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Business logic handlers
│   ├── middleware/      # Auth, Cloudinary upload middlewares
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── utils/           # Helper functions (Cloudinary, etc.)
│   └── index.js         # Entry point
│
├── frontend/
│   ├── public/          # Static assets, sw.js
│   ├── src/
│   │   ├── components/  # Reusable UI components (BottomNav, Splash, etc.)
│   │   ├── context/     # React Context (Auth, Cart)
│   │   ├── pages/       # Route views (Home, AdminDashboard, VendorMenu, etc.)
│   │   ├── App.jsx      # Main application router
│   │   └── firebase.js  # Firebase client configuration
│   └── vite.config.js   # Vite + PWA configuration
```

---

## 📝 Important Notes for Developers
- **Environment Variables:** Both frontend and backend require `.env` files (MongoDB URI, JWT Secret, Cloudinary keys, Firebase keys).
- **Security:** Do not allow vendors to pass `isGlobal: true` when creating item categories. The backend `categoryController` strictly enforces this.
- **Data Deletion:** Deleting categories is restricted if there are shops or products still actively linked to them to prevent orphaned data.
