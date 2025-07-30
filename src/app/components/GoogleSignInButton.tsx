"use client";

import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
// useRouter और useSearchParams को इम्पोर्ट करें
import { useRouter, useSearchParams } from 'next/navigation';

const saveUserToFirestore = async (user: User) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp(),
  }, { merge: true });
  console.log("User data saved to Firestore");
};

export const GoogleSignInButton = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // URL पैरामीटर्स को पढ़ने के लिए

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUserToFirestore(result.user);

      // FIX: रीडायरेक्ट URL की जाँच करें
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        router.push(redirectUrl); // अगर रीडायरेक्ट URL है, तो वहाँ भेजें
      } else {
        router.push('/dashboard'); // नहीं तो डैशबोर्ड पर भेजें
      }

    } catch (error) {
      console.error("Error during Google Sign-In:", error);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      type="button"
      className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <FcGoogle className="h-5 w-5 mr-2" />
      Sign in with Google
    </button>
  );
};
