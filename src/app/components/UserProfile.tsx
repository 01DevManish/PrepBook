"use client";

import { useState, useEffect } from "react";
import Image from 'next/image'; // 1. Import the Image component
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, DocumentData } from "firebase/firestore";

export const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please <a href="/login" className="text-indigo-600">log in</a> to see your profile.</div>;
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold">User Profile</h2>

      {/* 2. Replace <img> with <Image /> and add width/height props */}
      <Image 
        src={profile?.photoURL || '/default-avatar.png'} // Assumes default-avatar.png is in the /public folder
        alt="Profile" 
        width={80} 
        height={80}
        className="rounded-full my-4"
      />
      
      <p><strong>UID:</strong> {user.uid}</p>
      <p><strong>Display Name:</strong> {profile?.displayName || 'N/A'}</p>
      <p><strong>Email:</strong> {profile?.email || 'N/A'}</p>
      <p><strong>Phone Number:</strong> {profile?.phoneNumber || 'N/A'}</p>
    </div>
  );
};