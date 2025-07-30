import React from 'react';
import { FiPlayCircle, FiFileText, FiMessageSquare, FiAward } from 'react-icons/fi';

const features = [
  { title: 'Live Classes', description: 'Interact with top educators.', icon: <FiPlayCircle /> },
  { title: 'Mock Tests', description: 'Get the real exam experience.', icon: <FiFileText /> },
  { title: 'Quizzes', description: 'Practice topic-wise questions.', icon: <FiMessageSquare /> },
  { title: 'Performance Analysis', description: 'Track your progress.', icon: <FiAward /> },
];

export const Features = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
          Why Choose PrepBook?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center p-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto text-3xl">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};