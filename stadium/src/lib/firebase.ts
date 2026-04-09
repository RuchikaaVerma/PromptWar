import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyFakeKeyForInitialDemoSetup000000",
  authDomain: "stadium-sves-demo.firebaseapp.com",
  projectId: "stadium-sves-demo",
  storageBucket: "stadium-sves-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-ABCDEF1234"
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export default app;
