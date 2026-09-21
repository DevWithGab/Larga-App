import { createContext, useState, useEffect, useContext, useRef } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, setSessionPersistence } from '../services/firebase';
import { normalizeMobileNumber } from '../utils/phoneNumber';

// Port of larga-mobile/client/src/contexts/AuthContext.js. Same Firebase
// project, same users/{uid} document, so an account made on the phone logs in
// here and vice versa. The one deliberate difference is logOut: the mobile
// version closes out an active trip first, which only matters once a driver
// can broadcast from the browser (see DriverHomePage).
const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'driver' or 'commuter'
  const [profile, setProfile] = useState(null); // the users/{uid} Firestore doc
  const [loading, setLoading] = useState(true);
  // Creating the account signs the user in before signUp() has written their
  // users/{uid} document, so the listener below can win the race and read a
  // profile that doesn't exist yet — leaving a brand-new account looking
  // signed out with no second event coming to correct it. While a sign-up is
  // in flight, signUp() owns the state instead.
  const signingUpRef = useRef(false);
  const loggingInRef = useRef(false);
  const authVersionRef = useRef(0);

  const readProfile = async (firebaseUser) => {
    let snapshot;
    try {
      snapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
    } catch (cause) {
      const code = cause.code || 'unknown';
      console.error('Firestore profile read failed:', code, cause.message);
      const messages = {
        'permission-denied': 'Your login was accepted, but the database denied access to your profile. Please contact support.',
        'unavailable': 'Your login was accepted, but the database could not be reached. Check your connection and try again.',
        'unauthenticated': 'The database could not verify your session. Please log in again.',
        'resource-exhausted': 'The database is temporarily at its usage limit. Please try again later.',
      };
      const error = new Error(`${messages[code] || 'Your login was accepted, but your profile could not be loaded.'} (Error: ${code})`, { cause });
      error.code = code;
      throw error;
    }
    if (!snapshot.exists()) {
      throw new Error('Your account is missing its user profile. Please contact support to restore access.');
    }
    const data = snapshot.data();
    if (!['commuter', 'driver'].includes(data.userType)) {
      throw new Error('Your account profile has an invalid user type. Please contact support.');
    }
    return data;
  };

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (signingUpRef.current || loggingInRef.current) return;
      const version = ++authVersionRef.current;
      const isCurrent = () => active && version === authVersionRef.current;
      try {
        if (firebaseUser) {
          const userData = await readProfile(firebaseUser);
          if (!isCurrent()) return;
          setUser(firebaseUser);
          setUserType(userData.userType);
          setProfile(userData);
        } else {
          setUser(null);
          setUserType(null);
          setProfile(null);
        }
      } catch {
        // Restored sessions can retry from login, where profile errors are shown.
        if (isCurrent()) {
          setUser(null);
          setUserType(null);
          setProfile(null);
        }
      } finally {
        if (isCurrent()) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Creates the Firebase Auth account AND its Firestore profile doc.
  // `newProfile` must include `userType: 'driver' | 'commuter'` plus whatever
  // else that role's sign-up form collects.
  const signUp = async (email, password, newProfile) => {
    signingUpRef.current = true;
    ++authVersionRef.current;
    try {
      // No "remember me" box on sign-up, so a fresh account always gets the
      // persistent session. Set explicitly because persistence is app-wide:
      // without it, someone who logged in unticked, logged out, then registered
      // would silently inherit the tab-only session.
      await setSessionPersistence(true);
      const { user: createdUser } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', createdUser.uid), {
        ...newProfile,
        email,
        createdAt: serverTimestamp(),
      });

      // Publish the signed-in state here, since the listener stood down.
      // createdAt is left out on purpose: locally it's still an unresolved
      // serverTimestamp sentinel, not a date, and the next load reads the
      // real value from Firestore anyway.
      setUser(createdUser);
      setUserType(newProfile.userType);
      setProfile({ ...newProfile, email });
      setLoading(false);
      return createdUser;
    } finally {
      signingUpRef.current = false;
    }
  };

  // `remember` backs the login form's "Keep me logged in" box: true survives
  // closing the browser, false lasts only as long as the tab.
  const logIn = async (email, password, remember = true) => {
    loggingInRef.current = true;
    const version = ++authVersionRef.current;
    try {
      await setSessionPersistence(remember);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userData = await readProfile(credential.user);
      if (version !== authVersionRef.current || auth.currentUser?.uid !== credential.user.uid) {
        throw new Error('Your session changed. Please try logging in again.');
      }
      setUser(credential.user);
      setUserType(userData.userType);
      setProfile(userData);
      return credential;
    } finally {
      loggingInRef.current = false;
      setLoading(false);
    }
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

  const logOut = () => {
    ++authVersionRef.current;
    return signOut(auth);
  };

  // Edits the signed-in user's own users/{uid} document. updateDoc rather than
  // setDoc on purpose: it merges into the existing document and fails loudly if
  // there isn't one, where setDoc would happily create a half-built profile.
  //
  // It lives here, next to signUp and logIn, because `profile` is this
  // context's state — writing to Firestore without updating it would leave the
  // sidebar and the profile page showing the old name until a reload.
  const updateProfile = async (fields) => {
    if (!user) throw new Error('You need to be signed in to edit your profile.');
    if (Object.hasOwn(fields, 'phoneNumber')) {
      fields = { ...fields, phoneNumber: normalizeMobileNumber(fields.phoneNumber) };
    }
    await updateDoc(doc(db, 'users', user.uid), { ...fields, updatedAt: serverTimestamp() });
    // `fields` only: updatedAt is still an unresolved sentinel locally, not a
    // date, and nothing reads it in this session anyway.
    setProfile((current) => ({ ...current, ...fields }));
  };

  const value = { user, userType, profile, loading, signUp, logIn, logOut, resetPassword, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
