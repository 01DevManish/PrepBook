"use client";

import { useAuth } from "../../components/context/AuthContext";
import { db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { FiBarChart2, FiCheckCircle } from "react-icons/fi";

interface TestResult {
  id: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: {
    seconds: number;
  };
}

const MyTestsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchResults = async () => {
      try {
        // FIX: User ke sub-collection se data fetch karein
        const resultsRef = collection(db, 'users', user.uid, 'testResults');
        const q = query(resultsRef, orderBy('completedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedResults = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as TestResult));
        setResults(fetchedResults);
      } catch (error) {
        console.error("Error fetching user results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div>Loading your test history...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">My Test History</h1>
      {results.length > 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-300">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Test Name</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Date</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Score</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{result.testTitle}</td>
                  <td className="px-3 py-4 text-sm text-slate-500">{new Date(result.completedAt.seconds * 1000).toLocaleDateString()}</td>
                  <td className="px-3 py-4 text-sm text-slate-500 font-semibold">{result.score} / {result.totalQuestions}</td>
                  <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    <Link href={`/dashboard/tests/${result.id}`} className="text-indigo-600 hover:text-indigo-900">
                      View Analysis
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No tests attempted</h3>
            <p className="mt-1 text-sm text-gray-500">You have not attempted any tests yet.</p>
            <div className="mt-6">
                <Link href="/tests" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                    <FiBarChart2 className="-ml-0.5 mr-1.5 h-5 w-5" />
                    Attempt a Test
                </Link>
            </div>
        </div>
      )}
    </div>
  );
};

export default MyTestsPage;
