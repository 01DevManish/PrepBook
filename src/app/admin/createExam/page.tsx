"use client";

import { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { FiPlus, FiUpload, FiLoader } from 'react-icons/fi';

// Firestore में सेव होने वाले एग्जाम का टाइप
interface ExamData {
  title: string;
  slug: string;
  shortDescription: string;
  overview: string;
  examDates: string;
  eligibility: string;
  salary: string;
  admitCardInfo: string;
  studyNotes: string;
  news: string;
}

// JSON फ़ाइल से आने वाले डेटा का टाइप
interface JsonExam {
    name: string;
    description: string;
}
interface JsonCategory {
    category: string;
    exams: JsonExam[];
}


const CreateExamPage = () => {
  const [examData, setExamData] = useState<ExamData>({
    title: '', slug: '', shortDescription: '', overview: '', examDates: '', 
    eligibility: '', salary: '', admitCardInfo: '', studyNotes: '', news: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'title') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setExamData(prev => ({ ...prev, title: value, slug }));
    } else {
      setExamData(prev => ({ ...prev, [name]: value as string }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!examData.title || !examData.slug) {
        setMessage({ type: 'error', text: "Title cannot be empty." });
        setLoading(false);
        return;
    }

    try {
        const examsRef = collection(db, 'exams');
        const q = query(examsRef, where("slug", "==", examData.slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            setMessage({ type: 'error', text: `An exam with this slug already exists.` });
            return;
        }

        await addDoc(collection(db, 'exams'), { ...examData, createdAt: new Date() });
        setMessage({ type: 'success', text: `Exam "${examData.title}" created successfully!` });
    } catch {
        setMessage({ type: 'error', text: 'Failed to create exam.' });
    } finally {
        setLoading(false);
    }
  };

  const handleJsonUpload = async () => {
    if (!jsonFile) {
        setMessage({ type: 'error', text: 'Please select a JSON file.' });
        return;
    }
    setLoading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const content = event.target?.result;
            const categories: JsonCategory[] = JSON.parse(content as string);

            if (!Array.isArray(categories)) throw new Error("JSON must be an array of categories.");

            let addedCount = 0;
            let skippedCount = 0;
            const examsRef = collection(db, 'exams');
            const batch = writeBatch(db);

            for (const category of categories) {
                for (const exam of category.exams) {
                    // FIX: Add a check to ensure exam.name exists and is a string
                    if (!exam.name || typeof exam.name !== 'string') {
                        console.warn("Skipping an exam due to missing or invalid name:", exam);
                        skippedCount++;
                        continue; // Skip this exam and move to the next one
                    }

                    const slug = exam.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                    const q = query(examsRef, where("slug", "==", slug));
                    const querySnapshot = await getDocs(q);

                    if (querySnapshot.empty) {
                        const newExamRef = doc(examsRef);
                        const newExamData = {
                            title: exam.name,
                            slug: slug,
                            shortDescription: exam.description || '',
                            overview: `${exam.name} overview will be updated soon.`,
                            examDates: "To be announced.",
                            eligibility: "To be announced.",
                            salary: "To be announced.",
                            admitCardInfo: "To be announced.",
                            studyNotes: "To be announced.",
                            news: "To be announced.",
                            createdAt: new Date()
                        };
                        batch.set(newExamRef, newExamData);
                        addedCount++;
                    } else {
                        skippedCount++;
                    }
                }
            }

            await batch.commit();
            setMessage({ type: 'success', text: `Upload complete! Added: ${addedCount} new exams, Skipped (duplicates or errors): ${skippedCount}.` });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Invalid file format.";
            setMessage({ type: 'error', text: `Upload failed: ${errorMessage}` });
        } finally {
            setLoading(false);
            setJsonFile(null);
        }
    };
    reader.readAsText(jsonFile);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Bulk Upload Section */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Bulk Upload Exams</h1>
            <p className="text-slate-500 mb-4">Upload a JSON file with an array of exam objects to add multiple exams at once.</p>
            <div className="flex items-center gap-4">
                <input 
                    type="file" 
                    accept=".json"
                    onChange={(e) => setJsonFile(e.target.files ? e.target.files[0] : null)}
                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
                <button onClick={handleJsonUpload} disabled={loading || !jsonFile} className="bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-violet-700 transition-colors disabled:bg-gray-400 flex items-center gap-2">
                    {loading ? <FiLoader className="animate-spin" /> : <FiUpload />}
                    Upload JSON
                </button>
            </div>
        </div>

        {/* Single Exam Form */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Add a Single Exam</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
            {Object.keys(examData).filter(k => k !== 'slug').map((key) => (
                <div key={key}>
                <label className="block font-medium capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1')}</label>
                {key === 'overview' || key.includes('Info') || key.includes('Notes') ? (
                    <textarea name={key} value={examData[key as keyof ExamData]} onChange={handleInputChange} className="w-full p-2 border rounded-md h-24" />
                ) : (
                    <input type="text" name={key} value={examData[key as keyof ExamData]} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                )}
                </div>
            ))}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                {loading ? <FiLoader className="animate-spin" /> : <FiPlus />}
                Save Single Exam
            </button>
            </form>
        </div>

        {message && (
            <div className={`text-center font-semibold p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
            </div>
        )}
      </div>
    </div>
  );
};

export default CreateExamPage;
