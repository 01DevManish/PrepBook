import React from 'react';
import { AdvancedSearchBar } from './AdvancedSearchBar';

export const HeroSection = () => {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 leading-tight">
          {/* FIX: Replaced ' with &apos; to fix the error */}
          India&apos;s #1 Platform for <span className="text-indigo-600">Govt Exam</span> Prep
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Prepare for 500+ exams with live classes, mock tests, and practice questions.
        </p>
        <div className="mt-8">
          <AdvancedSearchBar />
        </div>
        <p className="mt-4 text-sm text-gray-500">Trusted by 3.4 Crore+ Students</p>
      </div>
    </section>
  );
};