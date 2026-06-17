const { initializeApp, getApps, cert } = require("firebase-admin/app");

let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Read from environment variable in production (Render)
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", err);
    }
} else {
    // Read from local file in development
    try {
        serviceAccount = require("./serviceAccountKey.json");
    } catch (err) {
        console.warn("⚠️ No serviceAccountKey.json found and FIREBASE_SERVICE_ACCOUNT is missing. Push notifications will not work!");
    }
}

let appInstance = null;

if (serviceAccount && getApps().length === 0) {
    appInstance = initializeApp({
        credential: cert(serviceAccount)
    });
}

module.exports = appInstance;
