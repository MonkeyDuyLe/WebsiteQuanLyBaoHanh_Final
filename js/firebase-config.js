// Firebase Configuration - TechCare Pro
// Dự án: websitequanlybaohanh
const firebaseConfig = {
    apiKey: "AIzaSyCZoSbkN2oTvVETsyfcvNky49qik4JSdsA",
    authDomain: "websitequanlybaohanh.firebaseapp.com",
    projectId: "websitequanlybaohanh",
    storageBucket: "websitequanlybaohanh.firebasestorage.app",
    messagingSenderId: "936286345883",
    appId: "1:936286345883:web:0392307f1c82944b5a843e",
    measurementId: "G-EPYMFFQ4CH"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global references
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
