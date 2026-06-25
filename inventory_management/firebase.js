// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZS7Vpkrv2yYhRkuH93HugtsYNTbVheJU",
  authDomain: "inventory-management-b61da.firebaseapp.com",
  projectId: "inventory-management-b61da",
  storageBucket: "inventory-management-b61da.firebasestorage.app",
  messagingSenderId: "532602801011",
  appId: "1:532602801011:web:5618cad4c9fd14b167d306",
  measurementId: "G-C3VYSFCFYV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };