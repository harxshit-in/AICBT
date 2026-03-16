import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDoc, doc, getDocs, query, orderBy, limit, updateDoc, deleteDoc, onSnapshot, setDoc, increment, where } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, onAuthStateChanged };

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

export async function updateNotification(id: string, data: any): Promise<void> {
  await updateDoc(doc(db, "notifications", id), data);
}

export async function deleteNotification(id: string): Promise<void> {
  await deleteDoc(doc(db, "notifications", id));
}

export async function getAnalyticsUsage(): Promise<any[]> {
  const q = query(collection(db, "analytics_usage"), orderBy("date", "desc"), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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

export async function reportError(errorDetails: any): Promise<void> {
  try {
    await addDoc(collection(db, "error_logs"), {
      ...errorDetails,
      createdAt: Date.now(),
      status: 'open'
    });
  } catch (e) {
    console.error("Failed to report error", e);
  }
}

export async function reportBug(bugDetails: any): Promise<void> {
  try {
    await addDoc(collection(db, "bug_reports"), {
      ...bugDetails,
      createdAt: Date.now(),
      status: 'open'
    });
  } catch (e) {
    console.error("Failed to report bug", e);
  }
}

export async function getReportedErrors(): Promise<any[]> {
  const q = query(collection(db, "error_logs"), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getReportedBugs(): Promise<any[]> {
  const q = query(collection(db, "bug_reports"), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveUserProfile(uid: string, profile: any): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    ...profile,
    updatedAt: Date.now()
  }, { merge: true });
}

export async function getUserProfile(uid: string): Promise<any | null> {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function logFeatureUsage(feature: string, model: string, success: boolean): Promise<void> {
  const date = new Date();
  const dayKey = date.toISOString().split('T')[0];
  const usageRef = doc(db, 'analytics_usage', `${dayKey}_${feature}_${model}`);
  await setDoc(usageRef, {
    feature,
    model,
    success: increment(success ? 1 : 0),
    failure: increment(success ? 0 : 1),
    count: increment(1),
    date: dayKey
  }, { merge: true });
}

export async function updateUserRole(uid: string, role: 'admin' | 'team_admin' | 'user'): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    role: role
  });
}

export async function updateUserStatus(uid: string, warningLevel: number, isBlocked: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    warningLevel: warningLevel,
    isBlocked: isBlocked
  });
}

export async function getAllUsers(): Promise<any[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export async function uploadCurrentAffairs(data: any): Promise<string> {
  const docRef = await addDoc(collection(db, "current_affairs"), {
    ...data,
    createdAt: Date.now(),
    approved: false
  });
  return docRef.id;
}

export async function getApprovedCurrentAffairs(): Promise<any[]> {
  const q = query(collection(db, "current_affairs"), orderBy("createdAt", "desc"), limit(50));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
    .filter(item => item.approved === true);
}

export async function getAllCurrentAffairs(): Promise<any[]> {
  const q = query(collection(db, "current_affairs"), orderBy("createdAt", "desc"), limit(100));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
}

export async function updateCurrentAffairsStatus(id: string, approved: boolean): Promise<void> {
  const docRef = doc(db, "current_affairs", id);
  await updateDoc(docRef, { approved });
}

export async function updateGlobalLeaderboard(uid: string, name: string, totalXP: number, accuracy: number): Promise<void> {
  if (totalXP >= 150 && accuracy >= 65) {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weekId = monday.toISOString().split('T')[0];

    await setDoc(doc(db, "leaderboard", `${weekId}_${uid}`), {
      uid,
      name,
      totalXP,
      accuracy,
      weekId,
      updatedAt: Date.now()
    }, { merge: true });
  }
}

export async function getGlobalLeaderboard(): Promise<any[]> {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const weekId = monday.toISOString().split('T')[0];

  const q = query(
    collection(db, "leaderboard"),
    where("weekId", "==", weekId),
    orderBy("totalXP", "desc"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

export async function createTopic(name: string, imageUrl: string): Promise<string> {
  const docRef = await addDoc(collection(db, "topics"), {
    name,
    imageUrl,
    status: 'open',
    createdBy: auth.currentUser?.uid,
    createdAt: Date.now()
  });
  return docRef.id;
}

export async function closeTopic(topicId: string): Promise<void> {
  await updateDoc(doc(db, "topics", topicId), { status: 'closed' });
}

export async function joinTopic(topicId: string, userId: string): Promise<void> {
  await setDoc(doc(db, "topic_members", `${topicId}_${userId}`), {
    topicId,
    userId,
    role: 'member',
    status: 'joined'
  });
}

export async function requestApproval(topicId: string, userId: string): Promise<void> {
  await setDoc(doc(db, "topic_members", `${topicId}_${userId}`), {
    topicId,
    userId,
    role: 'member',
    status: 'pending_approval'
  });
}

export async function approveUser(topicId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, "topic_members", `${topicId}_${userId}`), {
    role: 'approved_poster',
    status: 'joined'
  });
}

export async function sendMessage(topicId: string, userId: string, type: 'text' | 'poll' | 'image', content: string, pollData?: any): Promise<void> {
  await addDoc(collection(db, "messages"), {
    topicId,
    userId,
    type,
    content,
    pollData: pollData || null,
    createdAt: Date.now()
  });
}

export async function addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
  await setDoc(doc(db, "reactions", `${messageId}_${userId}`), {
    messageId,
    userId,
    emoji
  });
}

export async function getTopics(): Promise<any[]> {
  const q = query(collection(db, "topics"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getMessages(topicId: string): Promise<any[]> {
  const q = query(collection(db, "messages"), where("topicId", "==", topicId), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getTopicMembers(topicId: string): Promise<any[]> {
  const q = query(collection(db, "topic_members"), where("topicId", "==", topicId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
