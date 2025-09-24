// config/firebaseAdmin.js
const admin = require("firebase-admin");

let firebaseAdmin;
let serviceAccount;

try {
  // Load your Firebase service account key
if (process.env.GOOGLE_CREDENTIALS) {
  console.log("using google credentials");
  serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
console.log("First 1000 chars of private key:", serviceAccount.private_key.substring(0, 100));

  // 👇 convert literal \n into actual newlines
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    console.log("First 100 chars of private key:", serviceAccount.private_key.substring(0, 100));

  }} else {
  console.log("using local serviceAccountKey.json");
  serviceAccount = require("./serviceAccountKey.json");
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
