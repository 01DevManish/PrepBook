"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuth } from '../../components/context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { FiClock, FiAlertTriangle, FiCheckCircle,FiLoader} from 'react-icons/fi';
import Image from 'next/image';

// Types
interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  section: string;
}

interface TestDetails {
  title: string;
  duration: number;
  sections: string[];
}

const ProfessionalTestPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  const pathname = usePathname();

  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [markedForReview, setMarkedForReview] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const submitTest = useCallback(async () => {
    
    if (typeof window !== 'undefined' && window.localStorage.getItem('testSubmitted')) return;
    window.localStorage.setItem('testSubmitted', 'true');

    let score = 0;
    allQuestions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) score++;
    });
    
    const results = { score, total: allQuestions.length, answers, questions: allQuestions, testTitle: testDetails?.title || 'Test' };
    
    if (user) {
        const userResultsRef = collection(db, "users", user.uid, "testResults");
        await addDoc(userResultsRef, {
            testId, 
            testTitle: testDetails?.title, 
            score,
            totalQuestions: allQuestions.length, 
            answers, 
            questions: allQuestions,
            completedAt: serverTimestamp()
        });
    }
    
    localStorage.setItem('testResults', JSON.stringify(results));
    router.push(`/tests/${testId}/result`);
  }, [answers, allQuestions, router, testId, testDetails, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=${pathname}`);
      return;
    }

    const fetchTestData = async () => {
      try {
        const testDocRef = doc(db, 'tests', testId);
        const testDocSnap = await getDoc(testDocRef);

        if (!testDocSnap.exists()) {
          setError("Test not found."); return;
        }
        
        const details = testDocSnap.data() as TestDetails;
        if (!details.sections || details.sections.length === 0) details.sections = ["General"];
        setTestDetails(details);
        setTimeLeft(details.duration * 60);

        const questionsColRef = collection(db, 'tests', testId, 'questions');
        const questionsSnapshot = await getDocs(questionsColRef);
        const questionsData = questionsSnapshot.docs.map(doc => {
            const qData = doc.data();
            if (!qData.section) qData.section = "General";
            return { id: doc.id, ...qData } as Question;
        });
        
        if (questionsData.length === 0) {
            setError("This test has no questions."); return;
        }

        setAllQuestions(questionsData);
        setAnswers(new Array(questionsData.length).fill(null));
        setMarkedForReview(new Array(questionsData.length).fill(false));

      } catch {
        setError("An error occurred while loading the test.");
      } finally {
        setLoading(false);
      }
    };

    if (testId) fetchTestData();
  }, [testId, user, authLoading, router, pathname]);

  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, submitTest]);

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };
  
  const handleClearResponse = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = null;
    setAnswers(newAnswers);
  };

  const handleMarkForReview = () => {
    const newMarked = [...markedForReview];
    newMarked[currentQuestionIndex] = !newMarked[currentQuestionIndex];
    setMarkedForReview(newMarked);
    handleSaveAndNext();
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  if (loading || authLoading) return <div className="flex justify-center items-center h-screen"><FiLoader className="animate-spin text-indigo-500" size={40} /></div>;
  if (error) return <div className="flex flex-col justify-center items-center h-screen text-red-600"><FiAlertTriangle size={48} className="mb-4" /><h2 className="text-2xl font-bold">Could not load test</h2><p>{error}</p></div>;
  if (!testDetails || allQuestions.length === 0) return <div className="text-center p-10">Test data is unavailable.</div>;

  const currentQuestion = allQuestions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-md p-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-slate-800">{testDetails.title}</h1>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                <FiClock />
                <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>
            {user && (
                <div className="flex items-center gap-2">
                    <Image src={user.photoURL || '/default-avatar.png'} alt="User" width={32} height={32} className="rounded-full" />
                    <span className="text-sm font-medium hidden md:block">{user.displayName || 'Student'}</span>
                </div>
            )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex flex-col md:flex-row gap-4 p-4">
        {/* Left: Question Panel */}
        <div className="md:w-3/4 bg-white p-6 rounded-lg shadow-lg flex flex-col">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800">Question {currentQuestionIndex + 1}</h2>
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-green-600">+1.0</span>
                    <span className="text-red-600">-0.25</span>
                </div>
            </div>
            <p className="text-slate-800 text-lg mb-6 flex-grow">{currentQuestion.questionText}</p>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button key={index} onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-3 border-2 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                    answers[currentQuestionIndex] === index ? 'border-green-500 bg-green-50 font-semibold' : 'border-slate-300 hover:border-blue-500'
                  }`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[currentQuestionIndex] === index ? 'bg-green-500 border-green-500' : 'border-slate-400'}`}>
                    {answers[currentQuestionIndex] === index && <FiCheckCircle className="text-white" />}
                  </div>
                  {option}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-8 pt-4 border-t">
                <button onClick={handleSaveAndNext} className="bg-green-600 text-white font-semibold px-5 py-2 rounded-md hover:bg-green-700">Save & Next</button>
                <button onClick={handleClearResponse} className="bg-slate-200 text-slate-800 font-semibold px-5 py-2 rounded-md hover:bg-slate-300">Clear Response</button>
                <button onClick={handleMarkForReview} className="bg-purple-600 text-white font-semibold px-5 py-2 rounded-md hover:bg-purple-700">Mark for Review & Next</button>
            </div>
        </div>

        {/* Right: Palette & Submit */}
        <div className="md:w-1/4 bg-white p-6 rounded-lg shadow-lg flex flex-col">
           <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500"></div>Answered</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500"></div>Not Answered</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-200"></div>Not Visited</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-purple-500"></div>Marked for Review</div>
           </div>
           <div className="border-t pt-4 grid grid-cols-5 gap-2 overflow-y-auto flex-grow" style={{maxHeight: 'calc(100vh - 400px)'}}>
             {allQuestions.map((_, index) => {
                const isAnswered = answers[index] !== null;
                const isMarked = markedForReview[index];
                const isCurrent = currentQuestionIndex === index;
                let colorClass = 'bg-slate-200 text-slate-700';
                if (isAnswered && !isMarked) colorClass = 'bg-green-500 text-white';
                if (!isAnswered && !isMarked) colorClass = 'bg-red-500 text-white';
                if (isMarked) colorClass = 'bg-purple-500 text-white';

                return (
                    <button key={index} onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-10 h-10 rounded-md flex items-center justify-center font-semibold transition-transform hover:scale-110 ${colorClass} ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}>
                      {index + 1}
                    </button>
                );
              })}
           </div>
           <button onClick={() => setIsSubmitModalOpen(true)} className="w-full mt-auto bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700">
                Submit Test
           </button>
        </div>
      </div>
      
      {/* Submit Confirmation Modal */}
      <div className={`fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity ${isSubmitModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold text-slate-800">Submit Test?</h3>
              <p className="text-slate-600 my-4">Are you sure you want to submit the test? You will not be able to make any more changes.</p>
              <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                  <div className="bg-green-100 p-3 rounded-md text-center">Answered: {answers.filter(a => a !== null).length}</div>
                  <div className="bg-red-100 p-3 rounded-md text-center">Not Answered: {answers.filter(a => a === null).length}</div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                  <button onClick={() => setIsSubmitModalOpen(false)} className="px-6 py-2 rounded-md bg-slate-200 hover:bg-slate-300 font-semibold">Cancel</button>
                  <button onClick={() => submitTest()} className="px-6 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 font-semibold">Submit</button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ProfessionalTestPage;