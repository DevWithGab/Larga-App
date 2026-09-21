import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, setSessionPersistence } from '../services/firebase';
import { endActiveTrip } from '../services/driverSession';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'driver' or 'commuter'
  const [profile, setProfile] = useState(null); // the users/{uid} Firestore doc
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user type from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(firebaseUser);
          setUserType(userData.userType); // 'driver' or 'commuter'
          setProfile(userData);
        } else {
          // Auth account exists but the Firestore profile hasn't been
          // written yet (e.g. mid-signup) — don't treat as logged in.
          setUser(null);
          setUserType(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setUserType(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Creates the Firebase Auth account AND its Firestore profile doc.
  // `profile` must include `userType: 'driver' | 'commuter'` plus whatever
  // else that role's sign-up form collects (name, phone, jeepneyNumber...).
  const signUp = async (email, password, profile) => {
    // No "remember me" checkbox on the sign-up forms, so a fresh account always
    // gets the persistent session. Needed explicitly because persistence is
    // process-wide: without it, someone who logged in unticked, logged out, and
    // then registered would silently inherit the in-memory session.
    await setSessionPersistence(true);
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', newUser.uid), {
      ...profile,
      email,
      createdAt: serverTimestamp(),
    });
    return newUser;
  };

  // `remember` is the login screens' "Remember me" / "Keep me logged in" box:
  // true keeps the session on the phone across app restarts, false keeps it in
  // memory only. Defaults to true so any caller that omits it behaves as before.
  const logIn = async (email, password, remember = true) => {
    await setSessionPersistence(remember);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

  const logOut = async () => {
    // A driver who logs out mid-trip leaves `isOnline: true` behind in
    // Firestore with their last position frozen in it — nothing in the app
    // ever clears it, so commuters keep seeing a jeepney that is online and
    // permanently parked. Close the trip out first, while there is still an
    // authenticated user to write as, and don't let a failure here trap
    // someone in an account they asked to leave.
    if (user && userType === 'driver') {
      try {
        await endActiveTrip(user.uid);
      } catch (error) {
        console.warn('Failed to end active trip on logout:', error.message);
      }
    }
    return signOut(auth);
  };

  // Edits the signed-in user's own users/{uid} document. updateDoc rather than
  // setDoc on purpose: it merges into the existing document and fails loudly if
  // there isn't one, where setDoc would happily create a half-built profile.
  //
  // It lives here, next to signUp and logIn, because `profile` is this
  // context's state — writing to Firestore without updating it would leave
  // every screen showing the old name until the app is restarted.
  //
  // Mirrors updateProfile in larga-web/src/contexts/AuthContext.jsx; keep the
  // two in step so a profile edited on one shows up the same on the other.
  const updateProfile = async (fields) => {
    if (!user) throw new Error('You need to be signed in to edit your profile.');
    await updateDoc(doc(db, 'users', user.uid), { ...fields, updatedAt: serverTimestamp() });
    // `fields` only: updatedAt is still an unresolved sentinel locally, not a
    // date, and nothing reads it in this session anyway.
    setProfile((current) => ({ ...current, ...fields }));
  };

  const value = {
    user,
    userType,
    profile,
    loading,
    signUp,
    logIn,
    logOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
