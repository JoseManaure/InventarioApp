// src/components/Navbar.tsx
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const linkClass = (path: string) =>
    `px-4 py-2 rounded ${
      location.pathname === path
        ? 'bg-zinc-900 text-white'
        : 'text-zinc-700 hover:bg-zinc-200'
    }`;

  return (
    <nav className="flex gap-2 bg-zinc-50 p-4 shadow-md">
      <Link to="/inventario" className={linkClass('/inventario')}>
        Inventario
      </Link>
      <Link to="/cotizaciones" className={linkClass('/cotizaciones')}>
        Cotizaciones
      </Link>
      <Link to="/ver-facturas" className={linkClass('/ver-facturas')}>
        Ver Facturas
      </Link>
      <Link to="/productos" className={linkClass('/productos')}>
        Productos
      </Link>
    </nav>
  );
}
