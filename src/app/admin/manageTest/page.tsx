"use client";

import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { FiEdit, FiTrash2, FiPlus, FiSave, FiLoader, FiAlertTriangle, FiUpload, FiPackage } from 'react-icons/fi';

// Types
interface Test {
  id: string;
  title: string;
}

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
}

interface RawJsonQuestion {
    question: string;
    options: { [key: string]: string };
    answer: string;
}

// Reusable Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
                <div className="flex items-center mb-4">
                    <FiAlertTriangle className="text-red-500 mr-3" size={24} />
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                </div>
                <p className="text-slate-700 mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Confirm Delete</button>
                </div>
            </div>
        </div>
    );
};

// Function to generate sample questions
const generateSampleQuestions = (): Omit<Question, 'id'>[] => {
    const questions: Omit<Question, 'id'>[] = [];
    for (let i = 1; i <= 10; i++) {
        questions.push({
            questionText: `This is a sample question number ${i}?`,
            options: [`Sample Option A${i}`, `Sample Option B${i}`, `Sample Option C${i}`, `Sample Option D${i}`],
            correctAnswer: 0
        });
    }
    return questions;
};


const ManageTestsPage = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      setLoadingTests(true);
      const testsCollection = collection(db, 'tests');
      const q = query(testsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const testsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
      } as Test));
      setTests(testsData);
      setLoadingTests(false);
    };
    fetchTests();
  }, []);

  const handleSelectTest = async (test: Test) => {
    setSelectedTest(test);
    setLoadingQuestions(true);
    setMessage(null);
    const questionsColRef = collection(db, 'tests', test.id, 'questions');
    const questionsSnapshot = await getDocs(questionsColRef);
    const questionsData = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Question));
    setQuestions(questionsData);
    setLoadingQuestions(false);
  };

  const handleQuestionChange = (qIndex: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleUpdateQuestion = async (qIndex: number) => {
    if (!selectedTest) return;
    const question = questions[qIndex];
    setMessage({ type: 'success', text: 'Updating question...' });
    const questionDocRef = doc(db, 'tests', selectedTest.id, 'questions', question.id);
    try {
      await updateDoc(questionDocRef, {
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
      });
      setMessage({ type: 'success', text: 'Question updated successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update question.' });
    }
  };

  const openDeleteModal = (qIndex: number) => {
    setQuestionToDelete(qIndex);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteQuestion = async () => {
    if (questionToDelete === null || !selectedTest) return;
    const questionId = questions[questionToDelete].id;
    const questionDocRef = doc(db, 'tests', selectedTest.id, 'questions', questionId);
    try {
      await deleteDoc(questionDocRef);
      setQuestions(questions.filter(q => q.id !== questionId));
      setMessage({ type: 'success', text: 'Question deleted successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete question.' });
    } finally {
        setIsDeleteModalOpen(false);
        setQuestionToDelete(null);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
        id: `new-${Date.now()}`,
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleSaveNewQuestion = async (qIndex: number) => {
    if (!selectedTest) return;
    const question = questions[qIndex];
    try {
        const questionsColRef = collection(db, 'tests', selectedTest.id, 'questions');
        await addDoc(questionsColRef, {
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer
        });
        setMessage({ type: 'success', text: 'New question saved successfully!' });
        handleSelectTest(selectedTest);
    } catch {
        setMessage({ type: 'error', text: 'Failed to save new question.' });
    }
  };

  // Function to add sample questions
  const handleBulkAddSamples = async () => {
    if (!selectedTest) return;
    setLoadingQuestions(true);
    try {
        const questionsToAdd = generateSampleQuestions();
        const questionsColRef = collection(db, 'tests', selectedTest.id, 'questions');
        const batch = writeBatch(db);
        questionsToAdd.forEach(question => {
            const newQuestionRef = doc(questionsColRef);
            batch.set(newQuestionRef, question);
        });
        await batch.commit();
        setMessage({ type: 'success', text: 'Successfully added sample questions!' });
        handleSelectTest(selectedTest);
    } catch {
        setMessage({ type: 'error', text: 'Failed to add sample questions.' });
    } finally {
        setLoadingQuestions(false);
    }
  };

  // Function to upload questions from JSON, now with batching for 500+ questions
  const handleJsonUpload = async () => {
    if (!selectedTest || !jsonFile) return;
    setLoadingQuestions(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const content = event.target?.result;
            const rawQuestions: RawJsonQuestion[] = JSON.parse(content as string);
            
            if (!Array.isArray(rawQuestions) || rawQuestions.some(q => !q.question || typeof q.options !== 'object' || !q.answer)) {
                throw new Error("Invalid JSON format.");
            }

            const answerMapping: { [key: string]: number } = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
            const questionsToAdd = rawQuestions.map(q => {
                const optionsArray = Object.values(q.options);
                const correctAnswerIndex = answerMapping[q.answer.toUpperCase()];
                if (optionsArray.length !== 4 || correctAnswerIndex === undefined) {
                    throw new Error(`Invalid data for question: "${q.question.substring(0, 30)}..."`);
                }
                return { questionText: q.question, options: optionsArray, correctAnswer: correctAnswerIndex };
            });

            const questionsColRef = collection(db, 'tests', selectedTest.id, 'questions');
            const chunkSize = 499; // Firestore batch limit is 500
            for (let i = 0; i < questionsToAdd.length; i += chunkSize) {
                const chunk = questionsToAdd.slice(i, i + chunkSize);
                const batch = writeBatch(db);
                chunk.forEach(question => {
                    const newQuestionRef = doc(questionsColRef);
                    batch.set(newQuestionRef, question);
                });
                setMessage({ type: 'success', text: `Uploading ${i + chunk.length} of ${questionsToAdd.length} questions...` });
                await batch.commit();
            }

            setMessage({ type: 'success', text: `Successfully added ${questionsToAdd.length} questions!` });
            handleSelectTest(selectedTest);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setMessage({ type: 'error', text: `Upload failed: ${errorMessage}` });
        } finally {
            setLoadingQuestions(false);
            setJsonFile(null);
        }
    };
    reader.readAsText(jsonFile);
  };

  return (
    <>
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDeleteQuestion} title="Delete Question" message="Are you sure you want to permanently delete this question? This action cannot be undone." />
      <div className="min-h-screen bg-slate-100 flex font-sans">
        <aside className="w-80 bg-white p-4 border-r border-slate-200 flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-slate-800 px-2">Your Tests</h2>
            {loadingTests ? (
                <div className="flex justify-center items-center h-full"><FiLoader className="animate-spin text-indigo-500" size={24} /></div>
            ) : (
                <ul className="space-y-1 overflow-y-auto">
                {tests.map(test => (
                    <li key={test.id}>
                    <button onClick={() => handleSelectTest(test)} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-slate-700 ${ selectedTest?.id === test.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-slate-100' }`}>
                        {test.title}
                    </button>
                    </li>
                ))}
                </ul>
            )}
        </aside>
        <main className="flex-1 p-8 overflow-y-auto">
          {selectedTest ? (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-slate-900">Manage: {selectedTest.title}</h1>
              </div>
              
              {/* Bulk Actions Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-slate-800">Bulk Actions</h2>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-2">
                        <input type="file" accept=".json" onChange={(e) => setJsonFile(e.target.files ? e.target.files[0] : null)} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                        <button onClick={handleJsonUpload} disabled={loadingQuestions || !jsonFile} className="bg-violet-500 text-white font-semibold px-4 py-2 rounded-md hover:bg-violet-600 transition-colors disabled:bg-gray-400 flex items-center gap-2">
                            <FiUpload /> Upload JSON
                        </button>
                    </div>
                    <button onClick={handleBulkAddSamples} disabled={loadingQuestions} className="bg-teal-500 text-white font-semibold px-4 py-2 rounded-md hover:bg-teal-600 transition-colors disabled:bg-gray-400 flex items-center gap-2">
                        <FiPackage /> Add 10 Sample Questions
                    </button>
                </div>
              </div>

              {loadingQuestions ? (
                <div className="flex justify-center items-center h-64"><FiLoader className="animate-spin text-indigo-500" size={32} /></div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-4">
                      <textarea value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)} placeholder="Question text" className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-3">
                          <input type="radio" name={`correct-answer-${q.id}`} checked={q.correctAnswer === oIndex} onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                          <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      ))}
                      <div className="flex justify-end space-x-2 pt-2">
                        <button onClick={() => openDeleteModal(qIndex)} className="text-gray-500 p-2 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"><FiTrash2 /></button>
                        {q.id.startsWith('new-') ? (
                           <button onClick={() => handleSaveNewQuestion(qIndex)} className="text-gray-500 p-2 rounded-full hover:bg-green-100 hover:text-green-600 transition-colors"><FiSave /></button>
                        ) : (
                           <button onClick={() => handleUpdateQuestion(qIndex)} className="text-gray-500 p-2 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"><FiEdit /></button>
                        )}
                      </div>
                    </div>
                  ))}
                   <button onClick={handleAddQuestion} className="flex items-center space-x-2 text-indigo-600 font-semibold mt-6 px-4 py-2 rounded-md hover:bg-indigo-50 transition-colors">
                      <FiPlus />
                      <span>Add New Question</span>
                   </button>
                </div>
              )}
              {message && (
                <div className={`mt-4 text-center font-semibold p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-slate-600">
                <FiEdit size={48} className="mb-4" />
                <h2 className="text-xl font-semibold">Select a Test</h2>
                <p>Please select a test from the left panel to manage its questions.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ManageTestsPage;
