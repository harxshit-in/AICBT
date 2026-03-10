import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDoc, doc, getDocs, query, orderBy, limit, updateDoc, deleteDoc, onSnapshot, setDoc, increment } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { QuestionBank } from "./storage";

const firebaseConfig = {
  apiKey: "AIzaSyBfkYYde6dPYdT-Wo6nCnOiOKIaGO0tRXc",
  authDomain: "parikshai-harxshit.firebaseapp.com",
  projectId: "parikshai-harxshit",
  storageBucket: "parikshai-harxshit.firebasestorage.app",
  messagingSenderId: "88815516499",
  appId: "1:88815516499:web:ddf0fde4c41df8a0bbbfa6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function shareBank(bank: QuestionBank): Promise<string> {
  const dataToSave = {
    ...bank,
    sharedAt: Date.now(),
    isPublic: true, // Ensure it's marked as public in Firestore
    approved: false // Requires admin approval
  };

  // Remove undefined values recursively as Firestore doesn't support them
  const sanitizedData = JSON.parse(JSON.stringify(dataToSave));

  const docRef = await addDoc(collection(db, "shared_tests"), sanitizedData);
  await logAnalyticsEvent('shares');
  return docRef.id;
}

export async function getSharedBank(id: string): Promise<QuestionBank | null> {
  const docRef = doc(db, "shared_tests", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      ...docSnap.data(),
      bankId: docSnap.id
    } as QuestionBank;
  }
  return null;
}

export async function getPublicBanks(): Promise<QuestionBank[]> {
  const q = query(collection(db, "shared_tests"), orderBy("sharedAt", "desc"), limit(100));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    bankId: doc.id // Use Firestore ID as bankId for shared tests
  } as QuestionBank)).filter(bank => bank.approved === true);
}

export async function getAllSharedBanks(): Promise<QuestionBank[]> {
  const q = query(collection(db, "shared_tests"), orderBy("sharedAt", "desc"), limit(200));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    bankId: doc.id
  } as QuestionBank));
}

export async function updateSharedBank(id: string, data: Partial<QuestionBank>): Promise<void> {
  const docRef = doc(db, "shared_tests", id);
  await updateDoc(docRef, data);
}

export async function deleteSharedBank(id: string): Promise<void> {
  const docRef = doc(db, "shared_tests", id);
  await deleteDoc(docRef);
}

export async function sendNotification(title: string, body: string, attachmentUrl?: string): Promise<void> {
  await addDoc(collection(db, "notifications"), {
    title,
    body,
    attachmentUrl: attachmentUrl || null,
    createdAt: Date.now()
  });
}

export async function getNotifications(): Promise<any[]> {
  const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(20));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function listenToNotifications(callback: (notifications: any[]) => void) {
  const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(5));
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifications);
  });
}

export type AnalyticsEventType = 'visits' | 'shares' | 'pdf_uploads' | 'ai_analyses';

export async function logAnalyticsEvent(event: AnalyticsEventType): Promise<void> {
  try {
    const date = new Date();
    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const monthKey = dayKey.substring(0, 7); // YYYY-MM

    // Update daily stats
    const dayRef = doc(db, 'analytics_daily', dayKey);
    await setDoc(dayRef, { [event]: increment(1), date: dayKey }, { merge: true });

    // Update monthly stats
    const monthRef = doc(db, 'analytics_monthly', monthKey);
    await setDoc(monthRef, { [event]: increment(1), month: monthKey }, { merge: true });
  } catch (e) {
    console.error("Analytics error", e);
  }
}

export async function getAnalyticsData(type: 'daily' | 'monthly'): Promise<any[]> {
  const col = type === 'daily' ? 'analytics_daily' : 'analytics_monthly';
  const q = query(collection(db, col), orderBy(type === 'daily' ? 'date' : 'month', 'desc'), limit(30));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}
