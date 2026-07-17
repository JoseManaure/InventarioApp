// src/components/Navbar.tsx

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Boxes,
  FileText,
  FileInput,
  PackageCheck,
  Users,
  LogOut
} from 'lucide-react';

const links = [
  {
    path: '/dashboard-ventas',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'contador']
  },
  {
    path: '/inventario',
    label: 'Inventario',
    icon: Boxes,
    roles: ['admin', 'vendedor']
  },
  {
    path: '/cotizaciones',
    label: 'Documentos',
    icon: FileText,
    roles: [
      'admin',
      'vendedor',
      'contador'
    ]
  },
  {
    path: '/facturas',
    label: 'Entradas',
    icon: FileInput,
    roles: [
      'admin',
      'contador'
    ]
  },
  {
    path: '/productos',
    label: 'Productos',
    icon: PackageCheck,
    roles: [
      'admin',
      'vendedor'
    ]
  },
  {
    path: '/usuarios',
    label: 'Usuarios',
    icon: Users,
    roles: ['admin']
  }
];
export default function Navbar() {
  const { user, logout } = useAuth();

  const role = user?.role ?? "";

  console.log("USER:", user);
  console.log("ROLE:", role);
  const location = useLocation();

  return (

    <nav className="
      sticky top-0 z-50
      border-b border-gray-200/70 dark:border-gray-800
      bg-white/75 dark:bg-gray-950/70
      backdrop-blur-xl
    ">

      <div className="px-4 md:px-8">

        <ul className="
          flex items-center gap-2
          overflow-x-auto
          py-3
          scrollbar-hide
        ">

          {links
            .filter(link =>
              link.roles.includes(role)
            )
            .map(({ path, label, icon: Icon }) => {

              const isActive =
                location.pathname === path;

              return (

                <li key={path} className="relative">

                  <Link
                    to={path}
                    className={`
                    relative flex items-center gap-3
                    px-4 py-2.5
                    rounded-2xl
                    text-sm font-medium
                    transition-all duration-200
                    whitespace-nowrap

                    ${isActive
                        ? 'text-slate-900 dark:text-white'
                        : `
                        text-slate-500 dark:text-slate-400
                        hover:text-slate-900
                        dark:hover:text-white
                        hover:bg-slate-100
                        dark:hover:bg-gray-900
                      `
                      }
                  `}
                  >

                    {/* ACTIVE BACKGROUND */}
                    {isActive && (

                      <motion.div
                        layoutId="navbar-pill"
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30
                        }}
                        className="
                        absolute inset-0
                        bg-slate-100
                        dark:bg-gray-800
                        rounded-2xl
                        border border-slate-200
                        dark:border-gray-700
                        shadow-sm
                      "
                      />

                    )}

                    {/* CONTENT */}
                    <div className="relative z-10 flex items-center gap-3">

                      <Icon className="
                      w-4 h-4
                    " />

                      <span>
                        {label}
                      </span>

                    </div>

                  </Link>

                </li>

              );
            })}
          <li className="ml-auto">

            <button
              onClick={logout}
              className="
    flex items-center gap-3
    px-4 py-2.5
    rounded-2xl
    text-sm font-medium
    text-red-500
    hover:bg-red-50
    dark:hover:bg-red-950/40
    transition-all
  "
            >

              <LogOut className="w-4 h-4" />

              <span>
                Cerrar sesión
              </span>

            </button>

          </li>
        </ul>

      </div>

    </nav>
  );
}