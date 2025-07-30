"use client";

import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiHelpCircle } from 'react-icons/fi';
import Link from 'next/link';

// Define the types for the data we expect from localStorage
interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
}

interface TestResults {
  score: number;
  total: number;
  answers: (number | null)[];
  questions: Question[];
  testTitle: string;
}

const TestResultPage = () => {
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Retrieve results from localStorage
    const savedResults = localStorage.getItem('testResults');
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    }
    setLoading(false);

    // Optional: Clean up the localStorage after displaying the results
    return () => {
      localStorage.removeItem('testResults');
      localStorage.removeItem('testSubmitted');
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading results...</div>;
  }

  if (!results) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold mb-4">No results found.</h1>
        <p>It seems you have not completed a test yet.</p>
        <Link href="/tests" className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-md">
          Go to Tests
        </Link>
      </div>
    );
  }

  const { score, total, answers, questions, testTitle } = results;

  // FIX: Calculate detailed statistics
  const attempted = answers.filter(ans => ans !== null).length;
  const correct = score;
  const incorrect = attempted - correct;
  const unattempted = total - attempted;
  const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">{testTitle} - Result</h1>
          <p className="text-lg text-gray-500 mt-2">Here is your performance summary.</p>
          
          {/* FIX: Updated summary section with more details */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700 font-semibold">ATTEMPTED</p>
              <p className="text-3xl font-bold text-gray-800">{attempted} / {total}</p>
            </div>
            <div className="p-4 bg-green-100 rounded-lg">
              <p className="text-sm text-green-700 font-semibold">CORRECT</p>
              <p className="text-3xl font-bold text-green-800">{correct}</p>
            </div>
            <div className="p-4 bg-red-100 rounded-lg">
              <p className="text-sm text-red-700 font-semibold">INCORRECT</p>
              <p className="text-3xl font-bold text-red-800">{incorrect}</p>
            </div>
             <div className="p-4 bg-yellow-100 rounded-lg">
              <p className="text-sm text-yellow-700 font-semibold">SKIPPED</p>
              <p className="text-3xl font-bold text-yellow-800">{unattempted}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg col-span-2 md:col-span-1">
              <p className="text-sm text-blue-700 font-semibold">ACCURACY</p>
              <p className="text-3xl font-bold text-blue-800">{accuracy}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Review Your Answers</h2>
          <div className="space-y-6">
            {questions.map((q, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === q.correctAnswer;
              const isSkipped = userAnswer === null;

              return (
                <div key={q.id || index} className="border-b pb-6">
                  <p className="font-semibold text-lg mb-2">Q{index + 1}: {q.questionText}</p>
                  <div className="space-y-2">
                    {q.options.map((option, oIndex) => {
                      let optionClass = 'border-gray-300';
                      // Highlight the correct answer in green
                      if (oIndex === q.correctAnswer) {
                        optionClass = 'bg-green-100 border-green-500 text-green-800 font-semibold';
                      }
                      // If user's answer is wrong, highlight it in red
                      if (oIndex === userAnswer && !isCorrect) {
                        optionClass = 'bg-red-100 border-red-500 text-red-800';
                      }
                      return (
                        <div key={oIndex} className={`p-3 border rounded-md ${optionClass}`}>
                          {option}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-sm font-medium flex items-center">
                    {isSkipped ? (
                      <span className="flex items-center text-yellow-600"><FiHelpCircle className="mr-1"/>You skipped this question.</span>
                    ) : isCorrect ? (
                      <span className="flex items-center text-green-600"><FiCheck className="mr-1"/>Your answer is correct.</span>
                    ) : (
                      <span className="flex items-center text-red-600"><FiX className="mr-1"/>Your answer is incorrect.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="text-center mt-8">
            <Link href="/tests" className="bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700">
              Attempt Another Test
            </Link>
        </div>
      </div>
    </div>
  );
};

export default TestResultPage;
