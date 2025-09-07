// src/components/Layout.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { motion } from "framer-motion";

export default function Layout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 
                    dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 
                    text-gray-800 dark:text-gray-100 transition-colors duration-300">
      
      {/* Sidebar */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="h-full flex-shrink-0" // ✅ solo ocupa lo necesario
      >
        <Sidebar />
      </motion.div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Navbar */}
        <header className="sticky top-0 z-40 shadow-md bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <Navbar />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-screen-xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
