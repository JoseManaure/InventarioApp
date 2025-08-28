// src/components/Navbar.tsx
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const linkClass = (path: string) =>
    `px-4 py-2 rounded mr-2 transition-colors ${
      location.pathname === path
        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
        : 'text-zinc-700 dark:text-gray-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
    }`;

  return (
    <nav className="flex flex-wrap items-center bg-zinc-50 dark:bg-gray-800 p-4 shadow-md transition-colors">
      <Link to="/inventario" className={linkClass('/inventario')}>
        Inventario
      </Link>
      <Link to="/cotizaciones" className={linkClass('/cotizaciones')}>
        Cotizaciones
      </Link>
      <Link to="/facturas" className={linkClass('/ver-facturas')}>
        Entradas
      </Link>
      <Link to="/productos" className={linkClass('/productos')}>
        Productos
      </Link>
    </nav>
  );
}
