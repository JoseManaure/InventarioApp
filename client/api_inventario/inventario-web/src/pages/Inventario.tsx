import { useState } from 'react';
import api from '../api/api';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

export default function Inventario() {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<string[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  const enviarInventario = async () => {
    const lineas = texto.split('\n').filter((linea) => linea.trim() !== '');
    const mensajes: string[] = [];

    for (const linea of lineas) {
      const [nombre, cantidadStr, precio, fecha] = linea.split(',').map((e) => e.trim());
      if (!nombre || !cantidadStr || !fecha) continue;

      const cantidad = parseInt(cantidadStr);
      if (isNaN(cantidad)) continue;

      try {
        const res = await api.post('/items', {
          uuid: uuidv4(),
          nombre,
          cantidad,
          precio,
          fecha,
        });

        mensajes.push(`✅ ${res.data.nombre} → ${res.data._mensaje || 'Guardado correctamente'}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Error al guardar:', err);
        mensajes.push(`❌ ${nombre} → Error al guardar`);
      }
    }

    setResultados(mensajes);
    setTexto('');
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const mensajes: string[] = [];

      for (const row of parsedData) {
        const codigo = row['codigo'] || row['Codigo'] || '';
        const nombre = row['nombre'] || row['Nombre'];
        const cantidad = parseInt(row['cantidad'] || row['Cantidad']);
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
            fecha,
          });

          mensajes.push(`✅ ${res.data.nombre} → ${res.data._mensaje || 'Guardado correctamente'}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          console.error('Error al guardar:', err);
          mensajes.push(`❌ ${nombre} → Error al guardar`);
        }
      }

      setResultados(mensajes);
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
        placeholder="ej: tornillos, 20, 23000, 2025-07-10"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <br />
      <button onClick={enviarInventario}>Guardar</button>

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
