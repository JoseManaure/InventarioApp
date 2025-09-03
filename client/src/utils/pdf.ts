/* eslint-disable @typescript-eslint/ban-ts-comment */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/logo rasiva.png';

export type ProductoPDF = {
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
};

export function generarGuiaPDF(
  cliente: string,
  productos: ProductoPDF[],
  extras: {
    tipo: string;
    direccion: string;
    fechaEntrega: string;
    metodoPago: string;
    tipoDocumento: string;
    rutCliente?: string;
    numeroDocumento?: string;
    giroCliente?: string;
    direccionCliente?: string;
    comunaCliente?: string;
    ciudadCliente?: string;
    atencion?: string;
    emailCliente?: string;
    telefonoCliente?: string;
    formaPago?: string;
    nota?: string;
  }
) {
  const doc = new jsPDF();
  const fechaHoy = new Date().toLocaleDateString('es-CL');
  const numero = extras.numeroDocumento || 'N°000000';

  // Logo empresa
  if (logo) {
    doc.addImage(logo, 'PNG', 10, 10, 30, 30);
  }

  // Datos empresa
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('COMERCIAL RASIVA SpA.', 45, 15);
  doc.setFont('helvetica', 'normal');
  doc.text('RUT: 77 143 635-8', 45, 20);
  doc.text('Servicios de Ingeniería, Compra y Venta de materiales', 45, 25);
  doc.text('Construcción y Transportes.', 45, 30);
  doc.text('Fono: (02)    Cel. 9 6240 1457 - 9 5649 6112', 45, 35);
  doc.text('Dirección: Balmaceda N°01091, Malloco - Peñaflor', 45, 40);

  let tituloPDF = 'Documento';
  if (extras.tipo === 'cotizacion') tituloPDF = 'Cotización';
  else if (extras.tipo === 'nota') tituloPDF = 'Nota de Venta';
  else if (extras.tipo === 'guia') tituloPDF = 'Guía de Despacho';

  // Título centrado
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${tituloPDF.toUpperCase()} N° ${numero}`, 105, 50, { align: 'center' });

  // Datos cotización a la derecha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N - 000${numero}`, 160, 55);
  doc.text(`Fecha: ${fechaHoy}`, 160, 60);

  // Datos cliente en dos columnas
  const datosIzquierda = [
    ['Cliente:', cliente],
    ['RUT:', extras.rutCliente || '__________________'],
    ['Giro:', extras.giroCliente || '__________________'],
    ['Direccion:', extras.direccionCliente || '__________________'],
    ['Comuna:', extras.comunaCliente || '__________________'],
    ['Ciudad:', extras.ciudadCliente || 'Santiago'],
    ['Mail:', extras.emailCliente || '__________________'],
  ];

  const datosDerecha = [
    ['At. Sr.:', extras.atencion || '__________________'],
    ['Válida:', '3 días'],
    ['Dirección:', extras.direccion || '__________________'],
    ['Cel.:', extras.telefonoCliente || ''],
    ['Entrega:', extras.fechaEntrega || 'Por definir'],
    ['Pago:', extras.metodoPago || 'Contado'],
    [' ', ' ']
  ];

  let yCliente = 70;
  for (let i = 0; i < datosIzquierda.length; i++) {
    const [labelIzq, valueIzq] = datosIzquierda[i];
    const [labelDer, valueDer] = datosDerecha[i];

    doc.setFont('helvetica', 'bold');
    doc.text(labelIzq, 10, yCliente);
    doc.setFont('helvetica', 'normal');
    doc.text(valueIzq, 35, yCliente);

    doc.setFont('helvetica', 'bold');
    doc.text(labelDer, 110, yCliente);
    doc.setFont('helvetica', 'normal');
    doc.text(valueDer, 135, yCliente);

    yCliente += 6;
  }

  // Tabla productos
  const tablaProductos = autoTable(doc, {
    startY: yCliente + 5,
    head: [['Item', 'Cant.', 'Descripción', 'Valor Unit.', 'Total']],
    body: productos.map((p, i) => [
      `${i + 1}°`,
      p.cantidad,
      p.nombre,
      `$${p.precio.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`,
      `$${p.total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`,
    ]),
    styles: { 
      fontSize: 9, 
      halign: 'center',
      textColor: [40, 40, 40]
    },
    headStyles: { 
      fillColor: [0, 102, 204], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold'
    },
    alternateRowStyles: { 
      fillColor: [235, 245, 255]
    },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  });

  // Totales
  const subtotal = productos.reduce((acc, p) => acc + p.total, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = Math.round(subtotal + iva);

  const tablaTotales = autoTable(doc, {
    startY: tablaProductos.finalY + 10,
    body: [
      ['Neto', `$${subtotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`],
      ['IVA (19%)', `$${iva.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`],
      ['Total', `$${total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`]
    ],
    styles: { fontSize: 10, textColor: [40, 40, 40] },
    columnStyles: {
      0: { halign: 'right', cellPadding: { right: 15 } },
      1: { halign: 'right', cellWidth: 50 },
    },
    theme: 'plain',
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [0, 100, 0];
      }
    },
  });

  const finalY = tablaTotales.finalY || yCliente + 50;

  // Forma de pago y nota
  let yNotas = finalY + 35;
  doc.setFont('helvetica', 'bold');
  doc.text('Forma de Pago:', 10, yNotas);
  doc.setFont('helvetica', 'normal');
  doc.text(extras.formaPago || '__________________', 50, yNotas);

  yNotas += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Nota:', 10, yNotas);
  doc.setFont('helvetica', 'normal');
  doc.text(extras.nota || '__________________', 50, yNotas);

  // Transferencia
  yNotas += 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 0, 0);
  doc.text('Transferir a:', 10, yNotas);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Comercial Rasiva SpA', 10, yNotas + 6);
  doc.text('Cta.Vista N°21670187273 Bco.Estado', 10, yNotas + 12);
  doc.text('Rut. 77 143 635-8', 10, yNotas + 18);
  doc.setTextColor(0, 0, 255);
  doc.textWithLink('comercialrasiva@gmail.com', 10, yNotas + 24, { url: 'mailto:comercialrasiva@gmail.com' });

  return doc.output('blob');
}
