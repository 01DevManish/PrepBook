"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { FiClock, FiFileText, FiLoader, FiTag } from 'react-icons/fi';

// Test ke liye Type definition
interface Test {
  id: string;
  title: string;
  duration: number;
  totalQuestions: number;
  category: string; // Category ab ek zaroori field hai
}

const TestsPage = () => {
  const [allTests, setAllTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Tests');

  useEffect(() => {
    const fetchTests = async () => {
      try {
        // Sirf 'tests' collection se saare tests fetch karein
        const testsCollection = collection(db, 'tests');
        const testsQuery = query(testsCollection, orderBy('createdAt', 'desc'));
        const testsSnapshot = await getDocs(testsQuery);
        const testsData = testsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Test));
        setAllTests(testsData);

      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  // FIX: Sidebar ke liye categories ko database se dynamically generate kiya gaya hai
  const categories = useMemo(() => {
    // Sabhi tests se unique categories nikal kar ek Set banayein
    const uniqueCategories = new Set(allTests.map(test => test.category).filter(Boolean));
    // Set ko ek array me badal kar 'All Tests' ke saath jodein
    return ['All Tests', ...Array.from(uniqueCategories)];
  }, [allTests]);

  // Chuni hui category ke aadhar par tests ko filter karein
  const filteredTests = useMemo(() => {
    if (selectedCategory === 'All Tests') {
      return allTests;
    }
    return allTests.filter(test => test.category === selectedCategory);
  }, [allTests, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FiLoader className="animate-spin text-indigo-500" size={32} />
        <span className="ml-4 text-lg">Loading Tests...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto flex gap-8 p-8">
        {/* Categories ke liye Left Sidebar */}
        <aside className="w-1/4 hidden md:block">
          <div className="bg-white p-4 rounded-xl shadow-md sticky top-24">
            <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Categories</h3>
            <ul className="space-y-1">
              {categories.map(category => (
                <li key={category}>
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === category
                        ? 'bg-indigo-100 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FiTag size={16} />
                    <span>{category}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Tests ke liye Right Content Area */}
        <main className="w-full md:w-3/4">
          <h1 className="text-4xl font-bold mb-8 text-slate-900">{selectedCategory}</h1>
          {filteredTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map(test => (
                <div key={test.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col">
                  <h2 className="text-xl font-bold text-slate-900 flex-grow">{test.title}</h2>
                  <div className="flex items-center text-slate-500 mt-4 space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <FiFileText />
                      <span>{test.totalQuestions} Questions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiClock />
                      <span>{test.duration} mins</span>
                    </div>
                  </div>
                  <Link href={`/tests/${test.id}`} className="block w-full text-center mt-6 bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 transition-colors">
                    Start Test
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700">No Tests Found</h3>
<p className="mt-2 text-slate-500">
  There are no tests available in the &quot;{selectedCategory}&quot; category.
</p>            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TestsPage;
