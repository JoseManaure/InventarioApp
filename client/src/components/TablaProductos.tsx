// src/components/TablaProductos.tsx
import React from 'react';

interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
}

interface Props {
  productos: Producto[];
  onCantidadChange: (id: string, cantidad: number) => void;
  onEliminar: (id: string) => void;
}

export default function TablaProductos({ productos, onCantidadChange, onEliminar }: Props) {
  const subtotal = productos.reduce((a, p) => a + p.total, 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full bg-white text-sm text-gray-800">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-4 py-3 text-left w-24">Cantidad</th>
              <th className="px-4 py-3 text-left">Detalle</th>
              <th className="px-4 py-3 text-right w-32">Valor Unitario</th>
              <th className="px-4 py-3 text-right w-32">Subtotal</th>
              <th className="px-4 py-3 text-center w-20">Acción</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500 italic bg-gray-50">
                  🛒 Agrega productos desde el buscador superior. Aquí verás el resumen.
                </td>
              </tr>
            ) : (
              productos.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-right"
                      value={p.cantidad}
                      onChange={(e) => onCantidadChange(p.id, parseInt(e.target.value) || 1)}
                    />
                  </td>
                  <td className="px-4 py-3">{p.nombre}</td>
                  <td className="px-4 py-3 text-right">${p.precio.toLocaleString('es-CL')}</td>
                  <td className="px-4 py-3 text-right">${p.total.toLocaleString('es-CL')}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="text-red-500 hover:text-red-700 hover:underline text-sm"
                      onClick={() => onEliminar(p.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {productos.length > 0 && (
            <tfoot className="text-sm bg-gray-50 font-semibold">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right">Subtotal</td>
                <td colSpan={2} className="px-4 py-2 text-right">${subtotal.toLocaleString('es-CL')}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right">IVA (19%)</td>
                <td colSpan={2} className="px-4 py-2 text-right">${iva.toLocaleString('es-CL')}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-green-600">Total</td>
                <td colSpan={2} className="px-4 py-2 text-right text-green-600">${total.toLocaleString('es-CL')}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
