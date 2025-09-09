// src/components/GananciaModal.tsx
import { Dialog } from "@headlessui/react";

interface Producto {
  _id?: string;
  itemId?: { _id?: string; nombre?: string; costo?: number };
  nombre: string;
  cantidad: number;
  precio: number;
  costo?: number;
}

interface GananciaModalProps {
  open: boolean;
  onClose: () => void;
  productos: Producto[];
}

export default function GananciaModal({ open, onClose, productos }: GananciaModalProps) {
  const productosConGanancia = productos.map((p) => {
    const costoUnitario = p.costo ?? p.itemId?.costo ?? 0;
    const ganancia = ((p.precio ?? 0) - costoUnitario) * (p.cantidad ?? 0);
    const porcentaje =
      costoUnitario > 0 ? (((p.precio ?? 0) - costoUnitario) / costoUnitario) * 100 : 0;

    return {
      ...p,
      costoUnitario,
      ganancia,
      porcentaje,
    };
  });

  const totalGanancia = productosConGanancia.reduce((acc, p) => acc + (p.ganancia ?? 0), 0);

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Fondo oscuro */}
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

        {/* Contenedor principal */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-auto z-50 relative">
          {/* Header */}
          <div className="flex justify-between items-center border-b px-6 py-4">
            <Dialog.Title className="text-xl font-semibold text-slate-800">
              📊 Detalle de Ganancias
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase text-xs">
                  <th className="p-3 border-b">Producto</th>
                  <th className="p-3 border-b text-center">Cantidad</th>
                  <th className="p-3 border-b text-right">Precio Unitario</th>
                  <th className="p-3 border-b text-right">Costo Unitario</th>
                  <th className="p-3 border-b text-right">Ganancia</th>
                  <th className="p-3 border-b text-center">% Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {productosConGanancia.map((p, i) => (
                  <tr key={i} className="even:bg-slate-50 hover:bg-blue-50 transition">
                    <td className="p-3 border-b">{p.nombre}</td>
                    <td className="p-3 border-b text-center">{p.cantidad ?? 0}</td>
                    <td className="p-3 border-b text-right">
                      ${(p.precio ?? 0).toLocaleString("es-CL")}
                    </td>
                    <td className="p-3 border-b text-right">
                      ${(p.costoUnitario ?? 0).toLocaleString("es-CL")}
                    </td>
                    <td className="p-3 border-b text-right font-medium text-green-600">
                      ${(p.ganancia ?? 0).toLocaleString("es-CL")}
                    </td>
                    <td className="p-3 border-b text-center">
                      {p.porcentaje.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-slate-100">
                  <td className="p-3 border-t" colSpan={4}>
                    Total Ganancia:
                  </td>
                  <td className="p-3 border-t text-right text-green-700 text-lg">
                    ${(totalGanancia ?? 0).toLocaleString("es-CL")}
                  </td>
                  <td className="p-3 border-t"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
