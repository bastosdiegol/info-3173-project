import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref } from "firebase/storage";

// UPDATE THIS WITH YOUR PROJETC SPECIFIC
const firebaseConfig = {
  apiKey: "AIzaSyAUnyPxlIRM43L-KqMJf828Wsya91DerNw",
  authDomain: "phonegap-app-a0d39.firebaseapp.com",
  projectId: "phonegap-app-a0d39",
  storageBucket: "phonegap-app-a0d39.firebasestorage.app",
  messagingSenderId: "879535489521",
  appId: "1:879535489521:web:407b7491f81c8c70d34450",
};

var app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db = getDatabase(app);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(
  app,
  "gs://phonegap-app-a0d39.firebasestorage.app"
);
export const storageRef = ref(storage, "images/some-image.jpg");
