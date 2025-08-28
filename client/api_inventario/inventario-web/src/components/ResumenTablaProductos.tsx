// src/components/ResumenTablaProductos.tsx
import React, { memo, useCallback } from 'react';
import { Trash2 } from 'lucide-react';

interface ProductoResumen {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
  itemId?: {
    nombre?: string;
    precio?: number;
  };
}

interface Props {
  seleccionados: ProductoResumen[];
  subtotal: number;
  iva: number;
  total: number;
  onCantidadChange: (id: string, cantidad: number) => void;
  onEliminar: (id: string) => void;
  onPrecioChange: (id: string, precio: number) => void;
  placeholder?: string;
}

const ResumenTablaProductos = memo(
  ({
    seleccionados,
    subtotal,
    iva,
    total,
    onCantidadChange,
    onEliminar,
    onPrecioChange,
  }: Props) => {
    const handleCantidadChange = useCallback(
      (id: string, value: string) => {
        if (value === "") {
          onCantidadChange(id, 0);
          return;
        }
        const cantidad = parseInt(value, 10);
        if (!isNaN(cantidad) && cantidad >= 0) {
          onCantidadChange(id, cantidad);
        }
      },
      [onCantidadChange]
    );

    const handlePrecioChange = useCallback(
      (id: string, value: string) => {
        if (value === "") {
          onPrecioChange(id, 0);
          return;
        }
        const precio = parseFloat(value);
        if (!isNaN(precio) && precio >= 0) {
          onPrecioChange(id, precio);
        }
      },
      [onPrecioChange]
    );

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 bg-white shadow-lg rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-24">Cant.</th>
              <th className="px-4 py-3 text-left">Detalle</th>
              <th className="px-4 py-3 text-right w-32">Precio Unit.</th>
              <th className="px-4 py-3 text-right w-32">Subtotal</th>
              <th className="px-4 py-3 text-center w-20">Acción</th>
            </tr>
          </thead>

          <tbody>
            {seleccionados.map((p) => {
              const nombre = p.itemId?.nombre ?? p.nombre ?? '[Eliminado]';
              const precio = p.itemId?.precio ?? p.precio ?? 0;

              return (
                <tr
                  key={p.id}
                  className="border-b last:border-none hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={p.cantidad === 0 ? "" : p.cantidad}
                      onChange={(e) =>
                        handleCantidadChange(p.id, e.target.value)
                      }
                      className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">{nombre}</td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={precio === 0 ? "" : precio}
                      onChange={(e) =>
                        handlePrecioChange(p.id, e.target.value)
                      }
                      className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {(precio * p.cantidad).toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => onEliminar(p.id)}
                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {seleccionados.length > 0 && (
            <tfoot className="bg-gray-50 text-sm font-medium">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right">
                  Subtotal
                </td>
                <td colSpan={2} className="px-4 py-2 text-right">
                  ${subtotal.toLocaleString('es-CL')}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right">
                  IVA (19%)
                </td>
                <td colSpan={2} className="px-4 py-2 text-right">
                  ${iva.toLocaleString('es-CL')}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-2 text-right text-green-700 font-bold"
                >
                  Total
                </td>
                <td
                  colSpan={2}
                  className="px-4 py-2 text-right text-green-700 font-bold"
                >
                  ${total.toLocaleString('es-CL')}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  }
);

ResumenTablaProductos.displayName = 'ResumenTablaProductos';
export default ResumenTablaProductos;
