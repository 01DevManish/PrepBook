"use client";

import { useAuth } from "../../../components/context/AuthContext";
import { db } from "../../../lib/firebase";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from 'firebase/firestore';
import { FiCheck, FiX, FiMinus, FiLoader, FiAlertTriangle } from "react-icons/fi";
import Link from "next/link";

// Types
interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
}

interface TestResult {
  testTitle: string;
  score: number;
  answers: (number | null)[];
  questions: Question[]; // Sawaal result ke saath hi store hote hain
}

const AnalysisPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const resultId = params.resultId as string;

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchAnalysisData = async () => {
      try {
        // User ke sub-collection se result document fetch karein
        const resultDocRef = doc(db, 'users', user.uid, 'testResults', resultId);
        const resultDocSnap = await getDoc(resultDocRef);

        if (!resultDocSnap.exists()) {
          setError("Test result not found.");
          return;
        }
        
        const resultData = resultDocSnap.data() as TestResult;

        // Check karein ki result me sawaal store hain ya nahi
        if (!resultData.questions || resultData.questions.length === 0) {
            setError("This test result does not contain detailed analysis data.");
            return;
        }

        setResult(resultData);

      } catch (err) {
        console.error("Error fetching analysis data:", err);
        setError("An error occurred while loading the analysis.");
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      fetchAnalysisData();
    }
  }, [resultId, user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin mr-2" /> Loading Analysis...</div>;
  }

  if (error) {
     return (
        <div className="min-h-screen flex flex-col justify-center items-center text-center p-10 text-red-600">
            <FiAlertTriangle size={48} className="mb-4" />
            <h2 className="text-2xl font-bold">Could not load analysis</h2>
            <p>{error}</p>
        </div>
     );
  }
  
  if (!result) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Test Analysis: {result.testTitle}</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold mb-6">Review Your Answers</h2>
        <div className="space-y-8">
          {result.questions.map((q, index) => {
            const userAnswer = result.answers[index];
            const isCorrect = userAnswer === q.correctAnswer;
            const isSkipped = userAnswer === null;

            return (
              <div key={q.id || index} className="border-b border-slate-200 pb-8">
                <p className="font-semibold text-lg mb-4 text-slate-900">Q{index + 1}: {q.questionText}</p>
                <div className="space-y-3">
                  {q.options.map((option, oIndex) => {
                    let optionClass = 'border-gray-300 bg-white';
                    if (oIndex === q.correctAnswer) {
                      optionClass = 'bg-green-100 border-green-500 text-green-800 font-semibold';
                    }
                    if (oIndex === userAnswer && !isCorrect) {
                      optionClass = 'bg-red-100 border-red-500 text-red-800';
                    }
                    return (
                      <div key={oIndex} className={`p-3 border rounded-md flex items-center gap-3 ${optionClass}`}>
                        {oIndex === q.correctAnswer && <FiCheck className="text-green-600" />}
                        {oIndex === userAnswer && !isCorrect && <FiX className="text-red-600" />}
                        <span>{option}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-sm font-medium flex items-center">
                  {isSkipped ? ( <span className="flex items-center text-yellow-600"><FiMinus className="mr-2"/>You skipped this question.</span> ) : 
                   isCorrect ? ( <span className="flex items-center text-green-600"><FiCheck className="mr-2"/>Your answer is correct.</span> ) : 
                               ( <span className="flex items-center text-red-600"><FiX className="mr-2"/>Your answer is incorrect.</span> )
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
       <div className="text-center mt-8">
            <Link href="/dashboard/tests" className="bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700">
              Back to My Tests
            </Link>
        </div>
    </div>
  );
};

export default AnalysisPage;
