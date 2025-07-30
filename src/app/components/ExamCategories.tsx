import React from 'react';
import { FaLandmark, FaTrain, FaUserShield, FaChalkboardTeacher, FaBriefcase } from 'react-icons/fa';

const exams = [
  { name: 'SSC', icon: <FaUserShield className="h-8 w-8 text-indigo-500" /> },
  { name: 'Banking', icon: <FaLandmark className="h-8 w-8 text-indigo-500" /> },
  { name: 'Railways', icon: <FaTrain className="h-8 w-8 text-indigo-500" /> },
  { name: 'Teaching', icon: <FaChalkboardTeacher className="h-8 w-8 text-indigo-500" /> },
  { name: 'Civil Services', icon: <FaBriefcase className="h-8 w-8 text-indigo-500" /> },
];

export const ExamCategories = () => {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
          Select Your Exam Goal
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {exams.map((exam) => (
            <div key={exam.name} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center cursor-pointer">
              {exam.icon}
              <p className="mt-4 font-semibold text-gray-700">{exam.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};