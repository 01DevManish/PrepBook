"use client";

import { useAuth } from "../components/context/AuthContext";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, } from 'firebase/firestore';
import { FiLogOut, FiCheckSquare, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';



// Define the structure of a user's test result
interface TestResult {
  id: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

// Reusable Stat Card Component
const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
      <div className={`text-3xl p-3 rounded-full ${color}`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
);

const DashboardPage = () => {
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
        const resultsRef = collection(db, 'userResults');
        // FIX: Removed the orderBy from the Firestore query to prevent the index error.
        // We will sort the data on the client-side after fetching.
        const q = query(resultsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedResults = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as TestResult));

        // FIX: Sort the results by completion date here, in the browser.
        fetchedResults.sort((a, b) => b.completedAt.seconds - a.completedAt.seconds);

        setResults(fetchedResults);
      } catch (error) {
        console.error("Error fetching user results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Calculate statistics from fetched data
  const totalTests = results.length;
  const avgScore = totalTests > 0 ? (results.reduce((acc, r) => acc + (r.score / r.totalQuestions), 0) / totalTests * 100).toFixed(2) : '0.00';
  const highestScore = totalTests > 0 ? (Math.max(...results.map(r => r.score / r.totalQuestions)) * 100).toFixed(2) : '0.00';

  // Prepare data for the chart (last 5 tests)
  const chartData = results.slice(0, 5).reverse().map((r, index) => ({
    name: `Test ${totalTests - index}`,
    score: parseFloat(((r.score / r.totalQuestions) * 100).toFixed(2)),
  }));

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>;
  }
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user.displayName || 'User'}!</h1>
            <p className="text-gray-500 mt-1">Here&apos;s your progress summary.</p>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<FiCheckSquare />} title="Tests Attempted" value={String(totalTests)} color="bg-indigo-100 text-indigo-600" />
          <StatCard icon={<FiTarget />} title="Avg. Accuracy" value={`${avgScore}%`} color="bg-green-100 text-green-600" />
          <StatCard icon={<FiTrendingUp />} title="Highest Score" value={`${highestScore}%`} color="bg-amber-100 text-amber-600" />
        </div>
        
        {/* Chart and Recent Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md h-[400px]">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Your Recent Performance</h3>
                {results.length > 0 ? (
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis unit="%" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">No test data to display.</div>
                )}
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Test History</h3>
                <div className="space-y-4">
                    {results.length > 0 ? results.slice(0, 5).map(result => (
                        <div key={result.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                                <p className="font-semibold">{result.testTitle}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(result.completedAt.seconds * 1000).toLocaleDateString()}
                                </p>
                            </div>
                            <p className="font-bold text-lg">{result.score}/{result.totalQuestions}</p>
                        </div>
                    )) : (
                        <p className="text-gray-500">You haven&apos;t attempted any tests yet.</p>
                    )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
