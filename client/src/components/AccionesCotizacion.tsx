// src/components/AccionesCotizacion.tsx
import { CheckCircle, FileText } from 'lucide-react';

interface AccionesCotizacionProps {
  enviando: boolean;
  onGuardarBorrador: () => Promise<void>;
  onConfirmar: () => Promise<void>;
  pdfUrl: string | null;
  tipo: 'cotizacion' | 'nota';
  correlativo: number | null;
}

export default function AccionesCotizacion({
  enviando,
  onGuardarBorrador,
  onConfirmar,
  pdfUrl,
  tipo,
  correlativo,
}: AccionesCotizacionProps) {
  return (
    <div className="flex flex-wrap gap-4 justify-between mt-4">
      <div className="flex gap-2">
        <button
          onClick={onGuardarBorrador}
          disabled={enviando}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
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
          type="button"
        >
          <CheckCircle className="w-5 h-5" /> {enviando ? 'Creando...' : 'Confirmar'}
        </button>

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline self-center"
          >
            Ver PDF
          </a>
        )}
      </div>

      {correlativo && (
        <p className="text-lg font-medium text-gray-700 self-center">
          Número {tipo === 'cotizacion' ? 'de Cotización' : 'de Nota'}: {correlativo}
        </p>
      )}
    </div>
  );
}
