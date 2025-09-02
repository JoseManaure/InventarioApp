// src/components/Layout.tsx

import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Sidebar visible en todas las pantallas */}
      <div className="w-64 h-full">
        <Sidebar />
        
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-x-hidden overflow-y-hidden">
        <Navbar />
        <main className="overflow-y-auto max-h-screen p-6 overflow-x-hidden">
          <div className="max-w-screen-xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
