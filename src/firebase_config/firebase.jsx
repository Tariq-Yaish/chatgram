import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
//import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyA18I0NyhxWO1xCE5-4Ldkv3dEAj2TiUvQ",
    authDomain: "chatgram-8d68b.firebaseapp.com",
    projectId: "chatgram-8d68b",
    storageBucket: "chatgram-8d68b.firebasestorage.app",
    messagingSenderId: "624132861147",
    appId: "1:624132861147:web:ad2e1237b037fb69f970fe",
    measurementId: "G-X4FFT3FKW3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const auth = getAuth(app)