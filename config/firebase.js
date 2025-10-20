const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      // Use environment variables for Firebase configuration
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID || process.env.firebase_project_id,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.firebase_private_KEY?.replace(/\\n/g, '\n'), // Handle newlines in private key
        client_email: process.env.FIREBASE_CLIENT_EMAIL || process.env.firebase_client_email,
        client_id: process.env.firebase_client_ID || process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL || process.env.firebase_client_email)}`,
        universe_domain: 'googleapis.com'
      };

      // Validate required environment variables
      if (!serviceAccount.project_id || !serviceAccount.private_key_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Missing required Firebase environment variables. Please check your .env file.');
      }
      
      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully with environment variables');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    throw error;
  }
};

// Get the messaging service
const getMessaging = () => {
  try {
    return admin.messaging();
  } catch (error) {
    console.error('❌ Error getting Firebase messaging service:', error.message);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getMessaging,
  admin
};
