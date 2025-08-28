/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import api from '../api/api';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

export default function Inventario() {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<string[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [progreso, setProgreso] = useState(0); // ✅ progreso en %
  const [cargando, setCargando] = useState(false);

  const enviarInventario = async () => {
    const lineas = texto.split('\n').filter((linea) => linea.trim() !== '');
    const mensajes: string[] = [];
    setResultados([]);
    setProgreso(0);
    setCargando(true);

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];
      const [codigo, nombre, cantidadStr, costoStr, precioStr, fecha] = linea.split(',').map((e) => e.trim());
      if (!codigo || !nombre || !cantidadStr || !fecha) continue;

      const cantidad = parseInt(cantidadStr);
      const costo = parseFloat(costoStr);
      const precio = parseFloat(precioStr);

      if (isNaN(cantidad)) continue;

      try {
        const res = await api.post('/items', {
          uuid: uuidv4(),
          codigo,
          nombre,
          cantidad: 0,
          modo: 'catalogo',
          costo,
          precio,
          fecha,
        });

        mensajes.push(`✅ ${res.data.nombre} → ${res.data._mensaje || 'Guardado correctamente'}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Error al guardar:', err);
        mensajes.push(`❌ ${nombre} → Error al guardar`);
      }

      // 🔹 actualizar progreso
      setProgreso(Math.round(((i + 1) / lineas.length) * 100));
    }

    setResultados(mensajes);
    setTexto('');
    setCargando(false);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const mensajes: string[] = [];
      setResultados([]);
      setProgreso(0);
      setCargando(true);

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const codigo = row['codigo'] || row['Codigo'] || '';
        const nombre = row['nombre'] || row['Nombre'];
        const cantidad = parseInt(row['cantidad'] || row['Cantidad']);
        const costo = parseFloat(row['costo'] || row['Costo']);
        const precio = parseInt(row['precio'] || row['Precio']);
        const fecha = row['fecha'] || row['Fecha'];

        if (!nombre || !fecha || isNaN(cantidad)) {
          mensajes.push(`⚠️ Fila incompleta o malformada: ${JSON.stringify(row)}`);
          continue;
        }

        try {
          const res = await api.post('/items', {
            uuid: uuidv4(),
            codigo,
            nombre,
            cantidad,
            precio,
            costo,
            fecha,
          });

          mensajes.push(`✅ ${res.data.nombre} → ${res.data._mensaje || 'Guardado correctamente'}`);
        } catch (err: any) {
          console.error('Error al guardar:', err);
          mensajes.push(`❌ ${nombre} → Error al guardar`);
        }

        // 🔹 actualizar progreso
        setProgreso(Math.round(((i + 1) / parsedData.length) * 100));
      }

      setResultados(mensajes);
      setCargando(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Inventario</h2>

      <h4>Cargar archivo Excel</h4>
      <input type="file" accept=".xlsx" onChange={handleExcelUpload} />

      <hr />

      <h4>O ingresar manualmente</h4>
      <textarea
        rows={10}
        cols={50}
        placeholder="ej: 12022, tornillos, 20, costo, precio, 2025-07-10"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <br />
      <button onClick={enviarInventario} disabled={cargando}>
        {cargando ? 'Procesando...' : 'Guardar'}
      </button>

      {/* 🔹 Barra de progreso */}
      {cargando && (
        <div style={{ marginTop: 20, width: '100%', background: '#eee', borderRadius: 8 }}>
          <div
            style={{
              width: `${progreso}%`,
              background: '#4caf50',
              height: 20,
              borderRadius: 8,
              transition: 'width 0.3s ease',
              textAlign: 'center',
              color: 'white',
              fontSize: 12,
            }}
          >
            {progreso}%
          </div>
        </div>
      )}

      {resultados.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4>Resultado:</h4>
          <ul>
            {resultados.map((res, idx) => (
              <li key={idx}>{res}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
