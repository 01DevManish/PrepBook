"use client";

import { useState, useEffect } from 'react';
import { auth } from "../lib/firebase"; // Make sure this path is correct
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { FirebaseError } from 'firebase/app'; // 1. Import FirebaseError
import { useRouter } from 'next/navigation';

// This is necessary to extend the window object type for TypeScript
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export const PhoneSignIn = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Set up reCAPTCHA when the component loads
  useEffect(() => {
    if (!window.recaptchaVerifier) { // Check to prevent re-creation
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => console.log("reCAPTCHA verified."),
        });
    }
  }, []);

  // SEND OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!/^\d{10}$/.test(phoneNumber)) {
        setError("Please enter a valid 10-digit phone number.");
        setLoading(false);
        return;
    }

    try {
      const formattedPhoneNumber = `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier!;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      console.log("OTP Sent Successfully!");

    } catch (err) { // 2. FIX: Handle the error with a type check
      if (err instanceof FirebaseError) {
        console.error("OTP Send Error:", err.code, err.message);
        if (err.code === 'auth/too-many-requests') {
          setError("Too many requests. Please try again later.");
        } else {
          setError("Failed to send OTP. Please try again.");
        }
      } else {
        setError("An unexpected error occurred.");
        console.error("OTP Send Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP AND NAVIGATE
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (otp.length !== 6 || !confirmationResult) {
      setError("Please enter a valid 6-digit OTP.");
      setLoading(false);
      return;
    }
    
    try {
      const result = await confirmationResult.confirm(otp);
      console.log("Phone Auth Success! User:", result.user);
      router.push('/dashboard');

    } catch (err) { // 3. FIX: Also handle this error safely
       if (err instanceof FirebaseError) {
        console.error("OTP Verify Error:", err.code);
        if (err.code === 'auth/invalid-verification-code') {
            setError("Invalid OTP. Please try again.");
        } else {
            setError("Failed to verify OTP.");
        }
       } else {
        setError("An unexpected error occurred during verification.");
        console.error("OTP Verify Error:", err);
       }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div id="recaptcha-container"></div>
      {!isOtpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter 10-digit phone number"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-semibold py-2 rounded-md">
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-sm text-center text-gray-600">Enter the OTP sent to +91 {phoneNumber}</p>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-md">
            {loading ? 'Verifying...' : 'Verify OTP & Login'}
          </button>
        </form>
      )}
      {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
    </div>
  );
};