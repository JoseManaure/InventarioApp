import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generarGuiaPDF(productos: any[], datosCliente: any) {
  const doc = new jsPDF();

  // 📌 Encabezado con título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', 105, 15, { align: 'center' });

  // 📌 Datos del cliente
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const datosExtra = [
    `Cliente: ${datosCliente.nombre || ''}`,
    `RUT: ${datosCliente.rut || ''}`,
    `Dirección: ${datosCliente.direccion || ''}`,
    `Giro: ${datosCliente.giro || ''}`,
    `Comuna: ${datosCliente.comuna || ''}`,
    `Ciudad: ${datosCliente.ciudad || ''}`,
    `Atención: ${datosCliente.atencion || ''}`,
    `Email: ${datosCliente.email || ''}`,
    `Fecha: ${datosCliente.fecha || ''}`,
  ];

  datosExtra.forEach((linea, i) => {
    doc.text(linea, 14, 30 + i * 6);
  });

  // 📌 Tabla de productos
  autoTable(doc, {
    startY: 30 + datosExtra.length * 6 + 5,
    head: [['Item', 'Cant.', 'Descripción', 'Valor Unit.', 'Total']],
    body: productos.map((p, i) => [
      `${i + 1}°`,
      p.cantidad,
      p.nombre,
      `$${Math.round(p.precio).toLocaleString('es-CL')}`,
      `$${Math.round(p.total).toLocaleString('es-CL')}`,
    ]),
    styles: {
      fontSize: 10,
      halign: 'center',
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      textColor: [0, 0, 0], // 🔹 Texto negro
    },
    headStyles: {
      fillColor: [0, 51, 102], // Azul profundo
      textColor: [255, 255, 255], // Blanco
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      2: { halign: 'left' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Gris claro
    },
  });

  // 📌 Calcular totales
  const subtotal = productos.reduce((acc, p) => acc + p.total, 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva;
  const finalY = (doc as any).lastAutoTable?.finalY || 100;

  // 📌 Totales sin decimales
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Neto', 155, finalY + 10);
  doc.text(`$${Math.round(subtotal).toLocaleString('es-CL')}`, 180, finalY + 10, { align: 'right' });

  doc.text('IVA', 155, finalY + 16);
  doc.text(`$${Math.round(iva).toLocaleString('es-CL')}`, 180, finalY + 16, { align: 'right' });

  doc.text('Total', 155, finalY + 22);
  doc.text(`$${Math.round(total).toLocaleString('es-CL')}`, 180, finalY + 22, { align: 'right' });

  return doc;
}
