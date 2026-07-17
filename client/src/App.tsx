// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Login from './pages/Login';
import Dashboard from "./pages/Dashboard";
import DashboardVentas from './pages/DashboardVentas';
import Inventario from './pages/Inventario';
import Cotizaciones from './pages/Cotizaciones';
import FacturaCompra from './pages/FacturaCompra';
import Facturas from './pages/Facturas';
import Productos from './pages/Productos';
import NotasDeVenta from './pages/NotasDeVentas';
import VerCotizaciones from './pages/VerCotizaciones';
import VistaCotizacion from './pages/VistaCotizacion';
import ComparadorPrecios from './pages/CompararPrecios';
import VerBorradores from './pages/VerBorradores';
import EditarBorrador from './pages/EditarBorrador';
import GuiasDespacho from './pages/GuiasDespacho';
import Usuarios from "./pages/Usuarios";
import Configuracion from "./pages/Configuracion";
import Empresa from "./pages/Empresa";
import Clientes from "./pages/Clientes";
function App() {

  return (

    <Routes>

      {/* Login */}
      <Route
        path="/"
        element={<Login />}
      />

      {/* Rutas protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/empresa"
          element={
            <RoleRoute roles={["admin"]}>
              <Empresa />
            </RoleRoute>
          }
        />

        <Route
          path="/clientes"
          element={<Clientes />}
        />

        <Route
          path="/dashboard-ventas"
          element={<DashboardVentas />}
        />

        <Route
          path="/inventario"
          element={
            <RoleRoute roles={["admin", "vendedor"]}>
              <Inventario />
            </RoleRoute>
          }
        />

        <Route
          path="/cotizaciones"
          element={<Cotizaciones />}
        />

        <Route
          path="/ver-borradores"
          element={<VerBorradores />}
        />

        <Route
          path="/borrador/:id"
          element={<EditarBorrador />}
        />

        <Route
          path="/cotizacion/:id"
          element={<Cotizaciones />}
        />

        <Route
          path="/cotizaciones/:id"
          element={<Cotizaciones />}
        />

        <Route
          path="/cotizacion/:id/ver"
          element={<VistaCotizacion />}
        />

        <Route
          path="/cotizaciones/nueva"
          element={<Cotizaciones />}
        />

        <Route
          path="/guias/:notaId"
          element={<GuiasDespacho />}
        />

        <Route
          path="/ver-cotizaciones"
          element={<VerCotizaciones />}
        />

        <Route
          path="/facturas"
          element={
            <RoleRoute roles={["admin", "contador"]}>
              <Facturas />
            </RoleRoute>
          }
        />

        <Route
          path="/facturas/nueva"
          element={<FacturaCompra />}
        />

        <Route
          path="/productos"
          element={
            <RoleRoute roles={["admin", "vendedor"]}>
              <Productos />
            </RoleRoute>
          }
        />

        <Route
          path="/notas"
          element={<NotasDeVenta />}
        />

        <Route
          path="/comparador"
          element={
            <ComparadorPrecios
              nombreProducto="Producto X"
              precioLocal={1000}
            />
          }
        />

        <Route
          path="/comparar"
          element={
            <ComparadorPrecios
              nombreProducto="Producto Y"
              precioLocal={2000}
            />
          }
        />

        <Route
          path="/usuarios"
          element={
            <RoleRoute roles={["admin"]}>
              <Usuarios />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <RoleRoute roles={["admin"]}>
              <Configuracion />
            </RoleRoute>
          }
        />

      </Route>

    </Routes>

  );
}

export default App;