"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

interface Exam {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
}

export const ExamSelection = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsCollection = collection(db, 'exams');
        const q = query(examsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const examsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Exam));
        setExams(examsData);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) return <p>Loading exams...</p>;

  return (
    <section className="bg-slate-50 py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
          Choose Your Exam
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.map(exam => (
            <Link key={exam.id} href={`/exams/${exam.slug}`} className="block bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-xl font-bold text-indigo-700">{exam.title}</h3>
              <p className="text-gray-600 mt-2">{exam.shortDescription}</p>
              <div className="text-right mt-4 font-semibold text-indigo-600">
                View Details &rarr;
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
