import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDoc, doc } from "firebase/firestore";
import { QuestionBank } from "./storage";

const firebaseConfig = {
  apiKey: "AIzaSyCn4B2cubk2sEKA6uJ9PGrRVZGUZk3RdpU",
  authDomain: "learnkaro-5cbc3.firebaseapp.com",
  projectId: "learnkaro-5cbc3",
  storageBucket: "learnkaro-5cbc3.firebasestorage.app",
  messagingSenderId: "305527830545",
  appId: "1:305527830545:web:0a3646db4ca80af805d9b0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function shareBank(bank: QuestionBank): Promise<string> {
  const docRef = await addDoc(collection(db, "shared_tests"), {
    ...bank,
    sharedAt: Date.now()
  });
  return docRef.id;
}

export async function getSharedBank(id: string): Promise<QuestionBank | null> {
  const docRef = doc(db, "shared_tests", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as QuestionBank;
  }
  return null;
}
