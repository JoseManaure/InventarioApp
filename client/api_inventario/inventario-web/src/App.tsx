// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { User } from './types/User';
import Layout from './components/Layout';
import Login from './pages/Login';
import Inventario from './pages/Inventario';
import Cotizaciones from './pages/Cotizaciones';
import FacturaCompra from './pages/FacturaCompra';
import Facturas from './pages/Facturas';
import Productos from './pages/Productos';
import NotasDeVenta from './pages/NotasDeVentas';
import VerCotizaciones from './pages/VerCotizaciones';
import VerBorradores from './pages/VerBorradores';
import VistaCotizacion from './pages/VistaCotizacion';
import ComparadorPrecios from './pages/ComparadorPrecios';

import api, { setAuthToken } from './api/api';

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          console.error('Token inválido');
          localStorage.removeItem('token');
          setUser(null);
        });
    }
  }, []);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="inventario" element={<Inventario />} />
        <Route path="cotizaciones" element={<Cotizaciones />} />
        <Route path="ver-borradores" element={<VerBorradores />} />
        <Route path="cotizacion/:id" element={<Cotizaciones />} />
        <Route path="cotizaciones/:id" element={<Cotizaciones />} />
        <Route path="cotizacion/:id/ver" element={<VistaCotizacion />} />
          <Route path="/cotizaciones/nueva" element={<Cotizaciones />} />
        <Route path="ver-cotizaciones" element={<VerCotizaciones />} />
        <Route path="facturas" element={<Facturas />} />
        <Route path="facturas/nueva" element={<FacturaCompra />} />
        <Route path="productos" element={<Productos />} />
        <Route path="notas" element={<NotasDeVenta />} />
        <Route path="comparador" element={<ComparadorPrecios />} />
        <Route path="comparar" element={<ComparadorPrecios />} />
      </Route>
    </Routes>
  );
}

export default App;
