import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC-fcOJPo42VNPmPYr1bW9i8Q-W8VEot5E",
    authDomain: "blinkchat-99636.firebaseapp.com",
    projectId: "blinkchat-99636",
    storageBucket: "blinkchat-99636.firebasestorage.app",
    messagingSenderId: "310895438893",
    appId: "1:310895438893:web:81ef72a69cb79abb4e9ca4",
    measurementId: "G-6J9P7QR0WD"
  };
  
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage();
export const db = getFirestore();
const analytics = getAnalytics(app);