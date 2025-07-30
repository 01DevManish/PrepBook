"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiLoader } from 'react-icons/fi';
import Link from 'next/link';

interface SearchResult {
  id: number;
  title: string;
  category: 'Exam' | 'Course' | 'Blog';
  url: string;
}

const MOCK_DATA: SearchResult[] = [
  { id: 1, title: 'SSC CGL Tier 1', category: 'Exam', url: '/exams/ssc-cgl' },
  { id: 2, title: 'Complete Banking Course', category: 'Course', url: '/courses/banking' },
  { id: 3, title: 'How to prepare for Railways', category: 'Blog', url: '/blog/railways-prep' },
  { id: 4, title: 'UPSC Civil Services Prelims', category: 'Exam', url: '/exams/upsc-prelims' },
  { id: 5, title: 'IBPS PO Mains Test Series', category: 'Exam', url: '/exams/ibps-po' },
  { id: 6, title: 'Digital Marketing Fundamentals', category: 'Course', url: '/courses/digital-marketing' },
];

export const AdvancedSearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsDropdownVisible(false);
      return;
    }
    setIsLoading(true);
    setIsDropdownVisible(true);
    const handler = setTimeout(() => {
      const filteredResults = MOCK_DATA.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filteredResults);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groupedResults = results.reduce((acc, result) => {
    (acc[result.category] = acc[result.category] || []).push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="relative max-w-xl mx-auto" ref={searchContainerRef}>
      <div className="relative flex items-center">
        <FiSearch className="absolute left-4 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setIsDropdownVisible(true)}
          placeholder="Search for your exam..."
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
        {isLoading && <FiLoader className="absolute right-4 h-5 w-5 text-gray-400 animate-spin" />}
      </div>

      {isDropdownVisible && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-10 overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            Object.entries(groupedResults).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-bold text-gray-500 uppercase px-4 pt-4 pb-2">
                  {category}
                </h3>
                <ul>
                  {items.map(item => (
                    <li key={item.id}>
                      {/* FIX 2: Removed the <a> tag */}
                      <Link href={item.url} className="block px-4 py-2 hover:bg-indigo-50 transition-colors">
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            // FIX 1: Used a template literal for the string
            <div className="p-4 text-center text-gray-500">{`No results found for "${query}"`}</div>
          )}
        </div>
      )}
    </div>
  );
};