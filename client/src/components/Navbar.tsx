// src/components/Navbar.tsx
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Boxes,
  FileText,
  FileInput,
  PackageCheck
} from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setCollapsed(window.innerWidth < 768);
    handleResize(); // inicial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const links = [
    { path: '/inventario', label: 'Inventario', icon: Boxes },
    { path: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
    { path: '/facturas', label: 'Entradas', icon: FileInput },
    { path: '/productos', label: 'Productos', icon: PackageCheck },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-shadow duration-300
                  ${scrolled ? 'shadow-md' : 'shadow-sm'} 
                  bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700`}
    >
      <ul className="flex items-center px-4 py-2 space-x-4 md:space-x-6">
        {links.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;

          return (
            <li key={path} className="relative">
              <Link
                to={path}
                className={`flex items-center gap-2 md:gap-3 px-2 py-1 rounded transition-colors duration-200
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span className="text-sm">{label}</span>}
                
                {/* Underline animada */}
                <AnimatePresence>
                  {isActive && !collapsed && (
                    <motion.div
                      layoutId="underline"
                      className="absolute bottom-0 left-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      exit={{ width: 0 }}
                      transition={{ duration: 0.3, type: 'spring' }}
                    />
                  )}
                </AnimatePresence>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
