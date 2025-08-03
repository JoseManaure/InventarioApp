// src/components/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import {
  Boxes,
  FileText,
  ClipboardList,
  StickyNote,
  PackageCheck,
  FileInput,
  Files,
  ArchiveRestore,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { to: '/inventario', label: 'Inventario', icon: <Boxes className="w-5 h-5" /> },
    { to: '/cotizaciones', label: 'Nuevo Documento', icon: <FileText className="w-5 h-5" /> },
    { to: '/notas', label: 'Notas de Venta', icon: <StickyNote className="w-5 h-5" /> },
    { to: '/ver-cotizaciones', label: 'Cotizaciones', icon: <Files className="w-5 h-5" /> },
    { to: '/productos', label: 'Productos', icon: <PackageCheck className="w-5 h-5" /> },
    { to: '/facturas/nueva', label: 'Recepción Documentos', icon: <FileInput className="w-5 h-5" /> },
    { to: '/facturas', label: 'Ver Facturas', icon: <Files className="w-5 h-5" /> },
    { to: '/ver-borradores', label: 'Borradores', icon: <ArchiveRestore className="w-5 h-5" /> },
  ];

  return (
    <aside className="h-screen w-64 bg-[#1e1e2f] text-white flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center gap-2">
        <ClipboardList className="w-6 h-6" />
        <h2 className="text-xl font-semibold">Inventario</h2>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map(({ to, label, icon }) => (
          <SidebarLink key={to} to={to} label={label} icon={icon} active={location.pathname === to} />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => alert('Cerrar sesión')}
          className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-[#2a2a40] px-3 py-2 rounded w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  to,
  label,
  icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded ${
        active ? 'bg-[#2a2a40] text-white' : 'text-gray-300 hover:bg-[#2a2a40] hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
