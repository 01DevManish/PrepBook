"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../components/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { FiUser, FiLogOut, FiGrid, FiChevronDown, FiSearch, FiPlayCircle, FiFileText, FiX, FiAward, FiUsers, FiMap, FiBook, FiShield, FiBriefcase } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

// Mega Menu के लिए बेहतर डेटा स्ट्रक्चर (आइकन के साथ)
const examCategories = [
  { name: 'UPSC', icon: <FiAward />, subExams: [{ name: 'IAS Exam', href: '#' }, { name: 'UPSC CMS', href: '#' }, { name: 'UPSC Geo Scientist', href: '#' }, { name: 'IES ISS', href: '#' }, { name: 'UPSC EPFO', href: '#' }] },
  { name: 'SSC', icon: <FiUsers />, subExams: [{ name: 'SSC CGL', href: '#' }, { name: 'SSC CHSL', href: '#' }, { name: 'SSC MTS', href: '#' }] },
  { name: 'State PSC', icon: <FiMap />, subExams: [{ name: 'BPSC', href: '#' }, { name: 'UPPSC', href: '#' }, { name: 'MPPSC', href: '#' }] },
  { name: 'Teaching', icon: <FiBook />, subExams: [{ name: 'CTET', href: '#' }, { name: 'UPTET', href: '#' }, { name: 'KVS', href: '#' }] },
  { name: 'Defence', icon: <FiShield />, subExams: [{ name: 'NDA', href: '#' }, { name: 'CDS', href: '#' }] },
  { name: 'Banking', icon: <FiBriefcase />, subExams: [{ name: 'IBPS PO', href: '#' }, { name: 'SBI Clerk', href: '#' }] },
];

const Header = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isExamsDropdownOpen, setIsExamsDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(examCategories[0].name);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const examsDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsProfileDropdownOpen(false);
      router.push('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (examsDropdownRef.current && !examsDropdownRef.current.contains(event.target as Node)) {
        setIsExamsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-3xl font-extrabold text-blue-600">
          PrepBook
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
          <div className="relative" ref={examsDropdownRef}>
            <button
              onClick={() => setIsExamsDropdownOpen(!isExamsDropdownOpen)}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              Explore Exams <FiChevronDown className={`transition-transform duration-300 ${isExamsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <div 
              className={`absolute mt-4 w-[700px] -translate-x-1/4 bg-white rounded-md shadow-lg border grid grid-cols-3 transition-all duration-300 ease-in-out ${isExamsDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
              onMouseLeave={() => setActiveCategory(examCategories[0].name)}
            >
              <div className="col-span-1 border-r bg-slate-50 rounded-l-md py-2">
                {examCategories.map(cat => (
                  <button
                    key={cat.name}
                    onMouseEnter={() => setActiveCategory(cat.name)}
                    className={`w-full flex items-center gap-3 text-left px-4 py-2 text-sm transition-colors ${activeCategory === cat.name ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-200'}`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
              <div className="col-span-2 p-4 grid grid-cols-2 gap-2">
                {examCategories.find(cat => cat.name === activeCategory)?.subExams.map(exam => (
                  <Link key={exam.name} href={exam.href} onClick={() => setIsExamsDropdownOpen(false)} className="block px-3 py-1.5 text-sm hover:bg-slate-100 rounded-md transition-colors">
                    {exam.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link href="/tests" className="hover:text-blue-600 flex items-center gap-1.5 transition-colors"><FiFileText className="text-red-500" /> Test Series</Link>
          <Link href="#" className="hover:text-blue-600 flex items-center gap-1.5 transition-colors"><FiPlayCircle className="text-red-500" /> Live Tests</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Prev. Papers</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Quizzes</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="text-slate-600 hover:text-blue-600 transition-colors">
            <FiSearch size={20} />
          </button>
          
          {user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-transparent hover:ring-blue-500 transition-all"
              >
                {user.photoURL ? (
                  <Image src={user.photoURL} alt="Profile" width={36} height={36} />
                ) : (
                  <FiUser className="text-slate-600" />
                )}
              </button>
              <div className={`absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-10 transition-all duration-300 ease-in-out ${isProfileDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <div className="p-3 border-b">
                  <p className="text-sm font-semibold truncate">{user.displayName || user.email}</p>
                </div>
                <div className="py-1">
                  <Link href="/dashboard" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <FiGrid /> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login" className="bg-yellow-400 text-slate-800 font-semibold px-4 py-2 rounded-md text-sm hover:bg-yellow-500 transition-colors shadow-sm hover:shadow-md">
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const EnrollBanner = () => {
    const [isVisible, setIsVisible] = useState(true);
    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                <p className="text-sm font-medium">
                    All Exams Test series for 1 year @ <span className="font-bold text-yellow-300">₹349</span> only
                </p>
                <div className="flex items-center gap-4">
                    <button className="bg-yellow-400 text-blue-800 font-bold px-5 py-1.5 rounded-md text-sm hover:bg-yellow-300 transition-colors shadow hover:shadow-lg">
                        Enroll Now
                    </button>
                    <button onClick={() => setIsVisible(false)} className="text-white hover:bg-blue-800 p-1 rounded-full transition-colors">
                        <FiX size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export { Header, EnrollBanner };
