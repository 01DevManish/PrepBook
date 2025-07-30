"use client";

import { useAuth } from "../../components/context/AuthContext";
import { db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query,getDocs, orderBy } from 'firebase/firestore';
import { FiClipboard, FiPercent, FiStar, FiLoader } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define the structure of a user's test result
interface TestResult {
  id: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: {
    seconds: number;
  };
}

// Reusable Stat Card Component
const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 border border-slate-200">
      <div className={`text-2xl p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-sm font-semibold">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
);

const ProgressPage = () => {
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
        // FIX: Fetch results from the user's specific sub-collection
        const resultsRef = collection(db, 'users', user.uid, 'testResults');
        const q = query(resultsRef, orderBy('completedAt', 'asc'));
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

  // Calculate statistics
  const totalTests = results.length;
  const overallAccuracy = totalTests > 0 ? (results.reduce((acc, r) => acc + (r.score / r.totalQuestions), 0) / totalTests * 100).toFixed(2) : '0.00';
  const bestScore = totalTests > 0 ? (Math.max(...results.map(r => r.score / r.totalQuestions)) * 100).toFixed(2) : '0.00';

  // Prepare chart data
  const chartData = results.map((r) => ({
    name: r.testTitle.length > 15 ? `${r.testTitle.substring(0, 15)}...` : r.testTitle,
    Accuracy: parseFloat(((r.score / r.totalQuestions) * 100).toFixed(2)),
  }));

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin mr-2" /> Loading Progress...</div>;
  }
  
  if (!user) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Your Progress Report</h1>
      
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<FiClipboard />} title="Total Tests Taken" value={String(totalTests)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={<FiPercent />} title="Overall Accuracy" value={`${overallAccuracy}%`} color="bg-green-100 text-green-600" />
        <StatCard icon={<FiStar />} title="Best Performance" value={`${bestScore}%`} color="bg-yellow-100 text-yellow-600" />
      </div>
      
      {/* Performance Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 h-[400px]">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Performance Across Tests</h2>
        {results.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis unit="%" />
              <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} />
              <Legend />
              <Bar dataKey="Accuracy" fill="#4f46e5" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">No test data available to plot chart.</div>
        )}
      </div>

      {/* Detailed Test History Table */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Detailed History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Test Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Accuracy</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {results.length > 0 ? results.map(result => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{result.testTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(result.completedAt.seconds * 1000).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{result.score} / {result.totalQuestions}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-semibold">{((result.score / result.totalQuestions) * 100).toFixed(2)}%</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-500">You haven&apos;t attempted any tests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
