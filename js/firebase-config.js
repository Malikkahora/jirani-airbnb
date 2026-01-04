// TODO: Replace the values below with your specific Firebase Project configuration
// You can find these in the Firebase Console -> Project Settings -> General -> "Your apps"

const firebaseConfig = {
    apiKey: "AIzaSyB2M3O3Jos5XCkRLihe5KHkqIou0DGkEF4",
    authDomain: "jirani-airbnb.firebaseapp.com",
    projectId: "jirani-airbnb",
    storageBucket: "jirani-airbnb.firebasestorage.app",
    messagingSenderId: "549624303426",
    appId: "1:549624303426:web:d242ddc180a351dd6ac2db",
    measurementId: "G-RXQQT7BK8V"
};

// Initialize specific Firebase products we need
// These variables will be available globally since we are loading this script in HTML
// Initialize specific Firebase products we need
// These variables will be available globally since we are loading this script in HTML
window.db = null;
window.auth = null;
window.storage = null;

function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.error("Firebase SDK not loaded!");
        return;
    }

    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    } else {
        firebase.app(); // if already initialized
    }

    // Get instances
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    window.storage = firebase.storage();

    console.log("Firebase Initialized");
}
