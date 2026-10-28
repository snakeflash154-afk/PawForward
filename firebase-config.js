
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";


const firebaseConfig = {
    apiKey: "AIzaSyCces9tCAbFZ9HIBkjGcbbGsODRnzgolzo",
    authDomain: "pawforward-e9702.firebaseapp.com",
    projectId: "pawforward-e9702",
    storageBucket: "pawforward-e9702.firebasestorage.app",
    messagingSenderId: "228031703250",
    appId: "1:228031703250:web:21bcf44364910261f3250b",
    measurementId: "G-6FQ5DERN7R"
};

 
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);