import { Sidebar } from "../components/dashboard/Sidebar";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar will be visible on medium screens and up */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main content area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* You can add a mobile header here if needed */}
        {children}
      </main>
    </div>
  );
}
