"use client";

import { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { FiPlus, FiLoader, FiCheckCircle, FiUpload, FiArrowDown, FiArrowUp } from 'react-icons/fi';

// Types
interface Question {
  questionText: string;
  options: string[];
  correctAnswer: number;
}

interface Section {
  name: string;
  marksPerQuestion: number;
  negativeMarks: number;
  questions: Question[];
}

const CreateTestPage = () => {
  const [testTitle, setTestTitle] = useState('');
  const [category, setCategory] = useState('SSC');
  const [duration, setDuration] = useState(60);
  const [sections, setSections] = useState<Section[]>([{ name: 'Reasoning', marksPerQuestion: 1, negativeMarks: 0.25, questions: [] }]);
  const [activeSection, setActiveSection] = useState<number | null>(0);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAddSection = () => {
    setSections([...sections, { name: `New Section`, marksPerQuestion: 1, negativeMarks: 0.25, questions: [] }]);
    setActiveSection(sections.length);
  };

  const handleSectionChange = (index: number, field: keyof Omit<Section, 'questions'>, value: string | number) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };
  
  const handleAddQuestionManually = (sectionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].questions.push({ questionText: '', options: ['', '', '', ''], correctAnswer: 0 });
    setSections(newSections);
  };

  const handleQuestionChange = (sIndex: number, qIndex: number, field: 'questionText' | 'correctAnswer', value: string | number) => {
    const newSections = [...sections];
    const question = newSections[sIndex].questions[qIndex];
    newSections[sIndex].questions[qIndex] = { ...question, [field]: value };
    setSections(newSections);
  };

  const handleOptionChange = (sIndex: number, qIndex: number, oIndex: number, value: string) => {
    const newSections = [...sections];
    const newOptions = [...newSections[sIndex].questions[qIndex].options];
    newOptions[oIndex] = value;
    newSections[sIndex].questions[qIndex].options = newOptions;
    setSections(newSections);
  };

  const handleJsonUpload = (sIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const questionsFromFile = JSON.parse(event.target?.result as string);
        if (!Array.isArray(questionsFromFile)) throw new Error("JSON must be an array of questions.");
        
        // FIX: Validate each question from the JSON file
        const validatedQuestions = questionsFromFile.map((q: Question, index: number) => {
            if (typeof q.questionText !== 'string' || !Array.isArray(q.options) || typeof q.correctAnswer !== 'number' || q.options.length !== 4) {
                throw new Error(`Invalid format for question at index ${index}. Ensure 'questionText', 'options' (array of 4), and 'correctAnswer' exist.`);
            }
            return q;
        });

        const newSections = [...sections];
        newSections[sIndex].questions = [...newSections[sIndex].questions, ...validatedQuestions];
        setSections(newSections);
        setMessage({type: 'success', text: `${validatedQuestions.length} questions loaded into section.`});
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid JSON file format.";
        setMessage({type: 'error', text: message});
      }
    };
    reader.readAsText(file);
  };

  const handleCreateTest = async () => {
    if (!testTitle) {
      setMessage({ type: 'error', text: 'Please provide a test title.' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const allQuestions = sections.flatMap(s => s.questions.map(q => ({...q, section: s.name, subject: 'Imported'}))); // Added default subject
      if (allQuestions.length === 0) {
        setMessage({ type: 'error', text: 'Please add at least one question.' });
        setLoading(false);
        return;
      }

      const questionBankRef = collection(db, 'questionBank');
      const batch = writeBatch(db);
      const questionIds: string[] = [];
      
      allQuestions.forEach(question => {
        const newQuestionRef = doc(questionBankRef);
        batch.set(newQuestionRef, { ...question, createdAt: serverTimestamp() });
        questionIds.push(newQuestionRef.id);
      });
      await batch.commit();

      await addDoc(collection(db, 'tests'), {
        title: testTitle,
        category: category,
        duration: duration,
        sections: sections.map(s => s.name),
        sectionDetails: sections.map(s => ({ name: s.name, marksPerQuestion: s.marksPerQuestion, negativeMarks: s.negativeMarks })),
        totalQuestions: allQuestions.length,
        questionIds: questionIds,
        createdAt: serverTimestamp(),
      });

      setMessage({ type: 'success', text: `Test "${testTitle}" created successfully!` });
      setTestTitle('');
      setSections([{ name: 'Reasoning', marksPerQuestion: 1, negativeMarks: 0.25, questions: [] }]);

    } catch (error) {
      console.error("Error creating test:", error);
      setMessage({ type: 'error', text: 'Failed to create test.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Create New Test</h1>
        <button
          onClick={handleCreateTest}
          disabled={loading}
          className="bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-lg"
        >
          {loading ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
          Create Test
        </button>
      </div>
      
      {message && (
        <div className={`text-center font-semibold p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-md border grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-600">Test Title</label>
          <input type="text" value={testTitle} onChange={e => setTestTitle(e.target.value)} className="w-full p-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded-md bg-white">
            <option>SSC</option><option>PCS</option><option>UPSSC</option><option>RRB</option><option>State Exam</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">Duration (Minutes)</label>
          <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full p-2 border rounded-md" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-700">Sections & Questions</h2>
        {sections.map((section, sIndex) => (
          <div key={sIndex} className="bg-white rounded-xl shadow-md border">
            <button onClick={() => setActiveSection(activeSection === sIndex ? null : sIndex)} className="w-full flex justify-between items-center p-4">
              <h3 className="text-xl font-bold text-slate-700">{section.name} ({section.questions.length} Questions)</h3>
              {activeSection === sIndex ? <FiArrowUp /> : <FiArrowDown />}
            </button>
            {activeSection === sIndex && (
              <div className="p-6 border-t space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Section Name</label>
                    <input type="text" value={section.name} onChange={e => handleSectionChange(sIndex, 'name', e.target.value)} className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Marks per Question</label>
                    <input type="number" value={section.marksPerQuestion} onChange={e => handleSectionChange(sIndex, 'marksPerQuestion', Number(e.target.value))} className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Negative Marks</label>
                    <input type="number" step="0.01" value={section.negativeMarks} onChange={e => handleSectionChange(sIndex, 'negativeMarks', Number(e.target.value))} className="w-full p-2 border rounded-md" />
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-slate-700 mb-4">{`Add Questions to "${section.name}"`}</h4>
                  {section.questions.map((q, qIndex) => (
                    <div key={qIndex} className="border p-4 rounded-lg bg-slate-50 mb-4">
                      <textarea value={q.questionText} onChange={e => handleQuestionChange(sIndex, qIndex, 'questionText', e.target.value)} placeholder={`Question ${qIndex + 1}`} className="w-full p-2 border rounded-md mb-2 h-20" />
                      {q.options.map((opt, oIndex) => (
                        <input key={oIndex} type="text" value={opt} onChange={e => handleOptionChange(sIndex, qIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} className="w-full p-2 border rounded-md mb-2" />
                      ))}
                      <select value={q.correctAnswer} onChange={e => handleQuestionChange(sIndex, qIndex, 'correctAnswer', Number(e.target.value))} className="p-2 border rounded-md bg-white">
                        <option value={0}>Option 1 Correct</option><option value={1}>Option 2 Correct</option><option value={2}>Option 3 Correct</option><option value={3}>Option 4 Correct</option>
                      </select>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 mt-4">
                    <button onClick={() => handleAddQuestionManually(sIndex)} className="flex items-center gap-2 text-blue-600 font-semibold"><FiPlus /> Add Question Manually</button>
                    <input type="file" id={`json-upload-${sIndex}`} accept=".json" className="hidden" onChange={e => e.target.files && handleJsonUpload(sIndex, e.target.files[0])} />
                    <label htmlFor={`json-upload-${sIndex}`} className="flex items-center gap-2 text-green-600 font-semibold cursor-pointer"><FiUpload /> Upload from JSON</label>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <button onClick={handleAddSection} className="flex items-center gap-2 text-indigo-600 font-bold mt-6 p-2 rounded-md hover:bg-indigo-50">
          <FiPlus /> Add Another Section
        </button>
      </div>
    </div>
  );
};

export default CreateTestPage;
