"use client";

import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  linkText: string;
  linkHref: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, linkText, linkHref }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-slate-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {subtitle}{' '}
            <Link href={linkHref} className="font-medium text-indigo-600 hover:text-indigo-500">
              {linkText}
            </Link>
          </p>
        </div>
        {children}
      </div>
    </div>
  );
};