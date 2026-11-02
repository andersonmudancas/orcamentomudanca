import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, ADMIN_EMAIL } from '../firebase';

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // If user matches the admin email, register/ensure admin role doc
  if (user.email === ADMIN_EMAIL) {
    try {
      await setDoc(
        doc(db, 'admins', user.uid),
        {
          email: user.email,
          role: 'admin',
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Admin record check:', e);
    }
  }

  return user;
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuth(callback: (user: User | null, isAdmin: boolean) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    const isAdmin = Boolean(user && user.email === ADMIN_EMAIL);
    callback(user, isAdmin);
  });
}
