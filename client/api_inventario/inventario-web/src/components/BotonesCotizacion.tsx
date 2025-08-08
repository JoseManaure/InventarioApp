// src/components/BotonesCotizacion.tsx
import React from 'react';
import { CheckCircle, FileText } from 'lucide-react';

interface Props {
  onGuardar: () => void;
  onConfirmar: () => void;
  pdfUrl: string | null;
  enviando: boolean;
  tipo: 'cotizacion' | 'nota';
  correlativo: number | null;
}

export default function BotonesCotizacion({
  onGuardar,
  onConfirmar,
  pdfUrl,
  enviando,
  tipo,
  correlativo,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Acciones principales */}
      <div className="flex flex-wrap gap-4 justify-between">
        <div className="flex gap-2">
          <button
            onClick={onGuardar}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded font-semibold shadow"
          >
            <FileText className="w-5 h-5" /> Borrador
          </button>
          <button
            onClick={onConfirmar}
            disabled={enviando}
            className={`flex items-center gap-2 px-6 py-3 rounded font-semibold ${
              enviando
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <CheckCircle className="w-5 h-5" /> {enviando ? 'Creando...' : 'Confirmar'}
          </button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Ver PDF
            </a>
          )}
        </div>
      </div>

      {/* Correlativo */}
      {correlativo !== null && (
        <p className="text-lg font-medium text-gray-700">
          Número {tipo === 'cotizacion' ? 'de Cotización' : 'de Nota'}: {correlativo}
        </p>
      )}
    </div>
  );
}
