"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase'; // Adjust path if needed
import { FiLoader } from 'react-icons/fi';

// Context का टाइप डिफाइन करें
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// Context बनाएँ
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider कंपोनेंट बनाएँ
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // यह Firebase का लिस्नर है जो लॉगिन/लॉगआउट पर अपने आप चलता है
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // कंपोनेंट अनमाउंट होने पर लिस्नर को हटा दें
    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  // जब तक Firebase चेक कर रहा है, तब तक लोडिंग स्क्रीन दिखाएँ
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// एक कस्टम हुक बनाएँ ताकि कॉन्टेक्स्ट को आसानी से इस्तेमाल कर सकें
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};