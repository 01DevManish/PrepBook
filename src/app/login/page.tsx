"use client";

import { AuthLayout } from "../components/AuthLayout";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { PhoneSignIn } from "../components/PhoneSignIn";
import { useAuth } from "../components/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Head from "next/head";

const LoginPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Prevent flash of content while redirecting
  if (loading || user) {
    return null; 
  }
  
  return (
    <>
      <Head>
        <title>Login - PrepBook</title>
      </Head>
      <AuthLayout
        title="Welcome Back!"
        subtitle="Don't have an account?"
        linkText="Sign Up"
        linkHref="/signup"
      >
        <div className="space-y-4">
          <GoogleSignInButton />
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <PhoneSignIn />
        </div>
      </AuthLayout>
    </>
  );
};

export default LoginPage;