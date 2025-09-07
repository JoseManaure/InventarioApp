// src/components/Navbar.tsx
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
  const location = useLocation();

  const links = [
    { path: '/inventario', label: 'Inventario' },
    { path: '/cotizaciones', label: 'Cotizaciones' },
    { path: '/facturas', label: 'Entradas' },
    { path: '/productos', label: 'Productos' },
  ];

  return (
    <nav className="flex items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <ul className="flex space-x-4">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <li key={link.path} className="relative">
              <Link
                to={link.path}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="underline"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
