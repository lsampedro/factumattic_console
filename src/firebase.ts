import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCM6aGLxdUxtgN5NUmo5IKOUhIlqnQKz2Q",
  authDomain: "factumatic-551ff.firebaseapp.com",
  projectId: "factumatic-551ff",
  storageBucket: "factumatic-551ff.firebasestorage.app",
  messagingSenderId: "1094149228806",
  appId: "1:1094149228806:web:ac36eb46e3e9753395f687"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);