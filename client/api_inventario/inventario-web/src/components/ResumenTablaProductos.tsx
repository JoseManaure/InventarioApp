// src/components/ResumenTablaProductos.tsx
import React from 'react';

interface ProductoResumen {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
}

interface Props {
  seleccionados: ProductoResumen[];
  subtotal: number;
  iva: number;
  total: number;
  onCantidadChange: (id: string, cantidad: number) => void;
  onEliminar: (id: string) => void;
}

export default function ResumenTablaProductos({
  seleccionados,
  subtotal,
  iva,
  total,
  onCantidadChange,
  onEliminar,
}: Props) {
  return (
      <table className=" table-fixed border-collapse bg-white shadow-md rounded-lg min-h-[200px]">
        <thead>
          <tr className="bg-gray-100 text-gray-700 text-sm">
            <th className="px-4 py-2 w-24">Cantidad</th>
            <th className="px-4 py-2">Detalle</th>
            <th className="px-4 py-2 text-right w-32">Valor Unit.</th>
            <th className="px-4 py-2 text-right w-32">Subtotal</th>
            <th className="px-4 py-2 text-center w-24">Acción</th>
          </tr>
        </thead>
        <tbody>
          {seleccionados.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-6 text-gray-500 italic bg-gray-50">
                🛒 Agrega productos desde el buscador superior. Aquí verás el resumen.
              </td>
            </tr>
          ) : (
            seleccionados.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 text-sm">
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={1}
                    className="w-16 border rounded p-1 text-sm"
                    value={p.cantidad}
                    onChange={(e) => onCantidadChange(p.id, parseInt(e.target.value))}
                  />
                </td>
                <td className="px-4 py-2">{p.nombre}</td>
                <td className="px-4 py-2 text-right">${p.precio.toLocaleString('es-CL')}</td>
                <td className="px-4 py-2 text-right">${p.total.toLocaleString('es-CL')}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    className="text-red-600 hover:text-red-800 text-sm"
                    onClick={() => onEliminar(p.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
        {seleccionados.length > 0 && (
          <tfoot className="bg-gray-50 text-sm font-medium">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right">Subtotal</td>
              <td colSpan={2} className="px-4 py-2 text-right">${subtotal.toLocaleString('es-CL')}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right">IVA (19%)</td>
              <td colSpan={2} className="px-4 py-2 text-right">${iva.toLocaleString('es-CL')}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right text-green-700">Total</td>
              <td colSpan={2} className="px-4 py-2 text-right text-green-700">${total.toLocaleString('es-CL')}</td>
            </tr>
          </tfoot>
        )}
      </table>
  );
}
