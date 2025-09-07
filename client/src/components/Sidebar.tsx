// src/components/SidebarFlotante.tsx
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Boxes,
  FileText,
  StickyNote,
  Files,
  PackageCheck,
  FileInput,
  ArchiveRestore,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";

export default function SidebarFlotante() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const dark = localStorage.getItem("theme") === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const dark = html.classList.toggle("dark");
    setIsDark(dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  const links = [
    { to: "/inventario", label: "Inventario", icon: Boxes },
    { to: "/cotizaciones", label: "Documentos", icon: FileText },
    { to: "/notas", label: "NotasVentas", icon: StickyNote },
    { to: "/ver-cotizaciones", label: "Cotizaciones", icon: Files },
    { to: "/productos", label: "Productos", icon: PackageCheck },
    { to: "/facturas/nueva", label: "Recepción", icon: FileInput },
    { to: "/ver-borradores", label: "Borradores", icon: ArchiveRestore },
  ];

  return (
    <div>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
        title="Menú"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar flotante */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 bg-white dark:bg-gray-900 shadow-xl backdrop-blur-md border-r border-gray-200 dark:border-gray-700 transition-transform duration-300
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} w-64`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Rasiva SPA</h2>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Links */}
        <nav className="flex flex-col p-2 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`
              }
              onClick={() => setIsOpen(false)} // cierra sidebar al hacer clic
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
