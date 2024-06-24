// firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mvet-ef6b7.firebaseio.com"
});

const firestore = admin.firestore();
const auth = admin.auth();

module.exports = { firestore, auth };
