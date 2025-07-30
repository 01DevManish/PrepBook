"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiFileText, FiPlusCircle } from 'react-icons/fi';

const adminNavItems = [
  { href: '/admin/tests', icon: <FiFileText />, label: 'My Tests & Editor' },
  { href: '/admin/question-bank', icon: <FiGrid />, label: 'Question Bank' },
  { href: '/admin/createTest', icon: <FiPlusCircle />, label: 'Create New Test' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-4 border-b">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Admin Panel
          </Link>
        </div>
        <nav className="flex-grow p-4">
          <ul className="space-y-2">
            {adminNavItems.map((item) => (
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
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
