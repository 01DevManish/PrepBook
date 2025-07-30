"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Image from 'next/image';
import { FiUser, FiFileText, FiTrendingUp, FiBookOpen, FiSettings, FiLogOut, FiGrid } from 'react-icons/fi';

const navItems = [
  { href: '/dashboard', icon: <FiGrid />, label: 'Dashboard' },
  { href: '/dashboard/profile', icon: <FiUser />, label: 'Profile' },
  { href: '/dashboard/tests', icon: <FiFileText />, label: 'My Tests' },
  { href: '/dashboard/progress', icon: <FiTrendingUp />, label: 'Progress' },
  { href: '/dashboard/notes', icon: <FiBookOpen />, label: 'Notes' },
  { href: '/dashboard/settings', icon: <FiSettings />, label: 'Settings' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-slate-200">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          PrepBook
        </Link>
      </div>
      <nav className="flex-grow p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 transition-colors ${
                  pathname === item.href
                    ? 'bg-indigo-100 text-indigo-700 font-semibold'
                    : 'hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-200">
        {user && (
          <div className="flex items-center gap-3">
            {user.photoURL ? (
                <Image src={user.photoURL} alt="Profile" width={40} height={40} className="rounded-full" />
            ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                    <FiUser />
                </div>
            )}
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.displayName || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50">
                <FiLogOut />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
