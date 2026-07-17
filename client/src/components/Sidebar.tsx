// src/components/SidebarFlotante.tsx

import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Settings } from "lucide-react";

import {
  LayoutDashboard,
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
  Building2,
  X,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SidebarFlotante() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {

    const dark =
      localStorage.getItem("theme") === "dark";

    setIsDark(dark);

    document.documentElement.classList.toggle(
      "dark",
      dark
    );

  }, []);

  const toggleDarkMode = () => {

    const html = document.documentElement;

    const dark =
      html.classList.toggle("dark");

    setIsDark(dark);

    localStorage.setItem(
      "theme",
      dark ? "dark" : "light"
    );
  };


  const links = [
    {
      to: "/empresa",
      label: "Empresa",
      icon: Building2,
      roles: ["admin"]
    },
    {
      to: "/clientes",
      label: "Clientes",
      icon: Users,
      roles: ["admin", "vendedor"]
    },
    {
      to: "/dashboard-ventas",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "contador", "vendedor"]
    },
    {
      to: "/inventario",
      label: "Inventario",
      icon: Boxes,
      roles: ["admin", "vendedor"]
    },

    {
      to: "/cotizaciones",
      label: "Documentos",
      icon: FileText,
      roles: ["admin", "vendedor"]
    },

    {
      to: "/notas",
      label: "Notas",
      icon: StickyNote,
      roles: ["admin", "vendedor"]
    },

    {
      to: "/ver-cotizaciones",
      label: "Cotizaciones",
      icon: Files,
      roles: ["admin", "vendedor", "contador"]
    },

    {
      to: "/productos",
      label: "Productos",
      icon: PackageCheck,
      roles: ["admin", "vendedor"]
    },

    {
      to: "/facturas/nueva",
      label: "Recepción",
      icon: FileInput,
      roles: ["admin", "contador"]
    },

    {
      to: "/ver-borradores",
      label: "Borradores",
      icon: ArchiveRestore,
      roles: ["admin", "vendedor"]
    },
    {
      to: "/configuracion",
      label: "Configuración",
      icon: Settings,
      roles: ["admin"]
    }

  ];

  return (

    <>

      {/* BOTON */}
      <motion.button

        whileTap={{ scale: 0.95 }}

        whileHover={{ scale: 1.03 }}

        onClick={() => setIsOpen(!isOpen)}

        className="
          fixed top-5 left-5 z-50

          flex items-center justify-center

          w-11 h-11

          rounded-2xl

          border border-gray-200 dark:border-gray-700

          bg-white/80 dark:bg-gray-900/80

          backdrop-blur-xl

          shadow-lg shadow-black/5

          hover:bg-gray-100
          dark:hover:bg-gray-800

          transition-all duration-200
        "

      >

        <AnimatePresence mode="wait">

          <motion.div
            key={isOpen ? "close" : "menu"}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
          >

            {isOpen
              ? <X className="w-5 h-5" />
              : <Menu className="w-5 h-5" />
            }

          </motion.div>

        </AnimatePresence>

      </motion.button>

      {/* OVERLAY */}
      <AnimatePresence>

        {isOpen && (

          <motion.div

            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}

            className="
              fixed inset-0 z-30
              bg-black/40 backdrop-blur-sm
            "

            onClick={() => setIsOpen(false)}
          />

        )}

      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.aside

        initial={false}

        animate={{
          x: isOpen ? 0 : -320
        }}

        transition={{
          type: "spring",
          damping: 24,
          stiffness: 240
        }}

        className="
          fixed top-0 left-0 z-40

          h-full w-72

          bg-white/85 dark:bg-gray-950/85

          backdrop-blur-2xl

          border-r border-gray-200/70
          dark:border-gray-800

          shadow-2xl
        "

      >

        {/* HEADER */}
        <div className="
          h-20 px-6

          flex items-center justify-between

          border-b border-gray-200/70
          dark:border-gray-800
        ">

          <div>

            <h2 className="
              text-lg font-semibold tracking-tight
            ">
              Rasiva SPA
            </h2>

            <p className="
              text-xs text-gray-500 mt-1
            ">
              Gestión comercial
            </p>

          </div>

          {/* DARK MODE */}
          <button

            onClick={toggleDarkMode}

            className="
              w-10 h-10

              flex items-center justify-center

              rounded-xl

              hover:bg-gray-100
              dark:hover:bg-gray-800

              transition-colors
            "

          >

            {isDark
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }

          </button>

        </div>

        {/* LINKS */}
        <nav className="
          p-4 space-y-1
        ">

          {links
            .filter(link => user && link.roles.includes(user.role))
            .map(({ to, label, icon: Icon }) => (

              <NavLink

                key={to}

                to={to}

                onClick={() => setIsOpen(false)}

                className={({ isActive }) => `

                relative flex items-center gap-3

                px-4 py-3

                rounded-2xl

                text-sm font-medium

                transition-all duration-200

                ${isActive

                    ? `
                    bg-slate-900
                    text-white
                    shadow-lg shadow-slate-900/10
                  `

                    : `
                    text-gray-600
                    dark:text-gray-300

                    hover:bg-gray-100
                    dark:hover:bg-gray-900

                    hover:text-gray-900
                    dark:hover:text-white
                  `
                  }
              `}

              >

                <Icon className="w-4 h-4" />

                <span>
                  {label}
                </span>

              </NavLink>

            ))}

        </nav>

      </motion.aside>

    </>

  );
}