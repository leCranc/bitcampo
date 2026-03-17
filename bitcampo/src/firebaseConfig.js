// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB-Z3EHjjzk6wC33oaTroh_WzbeYf5lFLk",
  authDomain: "bitcampo-app.firebaseapp.com",
  projectId: "bitcampo-app",
  storageBucket: "bitcampo-app.firebasestorage.app",
  messagingSenderId: "1025931376252",
  appId: "1:1025931376252:web:ceddc9b04c196ce6ecbbf9",
  measurementId: "G-4JCEZF478K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, firebaseConfig };