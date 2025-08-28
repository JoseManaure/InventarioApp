// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import {
  Boxes,
  FileText,
  ClipboardList,
  StickyNote,
  PackageCheck,
  FileInput,
  Files,
  ArchiveRestore,
  Moon,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const dark = localStorage.getItem('theme') === 'dark';
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const dark = html.classList.toggle('dark');
    setIsDark(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  const links = [
    { to: '/inventario', label: 'Inventario', icon: Boxes },
    { to: '/cotizaciones', label: 'Documentos', icon: FileText },
    { to: '/notas', label: 'NotasVentas', icon: StickyNote },
    { to: '/ver-cotizaciones', label: 'Cotizaciones', icon: Files },
    { to: '/productos', label: 'Productos', icon: PackageCheck },
    { to: '/facturas/nueva', label: 'Recepción Documentos', icon: FileInput },
    { to: '/facturas', label: 'Entradas', icon: Files },
    { to: '/ver-borradores', label: 'Borradores', icon: ArchiveRestore },
  ];

  return (
    <aside className="h-screen w-60 bg-white dark:bg-gray-900 text-gray-800 dark:text-white flex flex-col shadow-lg">
      {/* Encabezado */}
      <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold">Rasiva SPA</h2>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          title="Cambiar tema"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
