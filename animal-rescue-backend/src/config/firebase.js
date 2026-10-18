const admin = require('firebase-admin');
const fs = require('fs');

let isConfigured = false;

function initFirebase() {
  if (admin.apps && admin.apps.length > 0) {
    isConfigured = true;
    return admin;
  }

  try {
    // 1. Service account JSON file path
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
      const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isConfigured = true;
      return admin;
    }

    // 2. Inline service account JSON string
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isConfigured = true;
      return admin;
    }

    // 3. Individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : null;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      isConfigured = true;
      return admin;
    }
  } catch (err) {
    console.warn('[FIREBASE WARNING] Failed to initialize Firebase Admin SDK:', err.message);
  }

  return admin;
}

initFirebase();

module.exports = {
  admin,
  isConfigured: () => isConfigured,
};

