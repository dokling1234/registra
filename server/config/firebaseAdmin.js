// config/firebaseAdmin.js
const admin = require("firebase-admin");

let firebaseAdmin;

try {
  // Load your Firebase service account key
if (process.env.GOOGLE_CREDENTIALS) {
  console.log("using google credentials")
  (console.log(process.env.GOOGLE_CREDENTIALS))
  // Running on Heroku
  serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} else {
  // Running locally with JSON file
  serviceAccount = require("./config/serviceAccountKey.json");
  console.log("using service account key")
}
  // Initialize Firebase Admin SDK only once
  if (!admin.apps.length) {
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    firebaseAdmin = admin.app();
  }

  console.log("✅ Firebase Admin initialized successfully.");
} catch (error) {
  console.error("⚠️ Firebase Admin initialization failed, using mock:", error);

  // Fallback mock implementation (no crash in dev)
  firebaseAdmin = {
    messaging: () => ({
      send: async (message) => {
        console.log("📢 Mock Firebase notification:", message);
        return { messageId: "mock-message-id" };
      },
    }),
  };
}

module.exports = firebaseAdmin;
