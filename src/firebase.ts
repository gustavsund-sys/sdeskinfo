import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
const firebaseConfig={apiKey:'AIzaSyCRNJDCnUoh0UswBHFDN6f1HoDnptt4bxE',authDomain:'sdeskinfo-c7941.firebaseapp.com',projectId:'sdeskinfo-c7941',storageBucket:'sdeskinfo-c7941.firebasestorage.app',messagingSenderId:'37094499840',appId:'1:37094499840:web:a691e23e8c31e0a78c5ae5'};
export const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});
