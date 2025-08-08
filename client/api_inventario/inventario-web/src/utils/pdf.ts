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
    tipo:string;
    direccion:string;
    fechaEntrega: string;
    metodoPago: string;
    tipoDocumento: string;
    cotizacionBaseNumero?: number;
    rutCliente?: string;
    numeroDocumento?: string;
      giroCliente?: string;
      direccionCliente?: string;
      comunaCliente?: string;
      ciudadCliente?: string;
      atencion?: string;
      emailCliente?: string;
      telefonoCliente?: string;
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

if (extras.tipo === 'cotizacion') {
  tituloPDF = 'Cotización';
} else if (extras.tipo === 'nota') {
  tituloPDF = 'Nota de Venta';
} else if (extras.tipo === 'guia') {
  tituloPDF = 'Guía de Despacho';
}
  // Título centrado
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
 doc.setFontSize(16);
doc.setFont('helvetica', 'bold');

let tituloCompleto = `${tituloPDF.toUpperCase()} N° ${numero}`;
if (extras.tipo === 'nota' && extras.cotizacionBaseNumero) {
  tituloCompleto += ` - Basado en Cotización N° ${extras.cotizacionBaseNumero}`;
}

doc.setFontSize(14);
doc.setFont('helvetica', 'bold');
doc.text(tituloCompleto, 105, 50, { align: 'center' });

  // Datos cotización a la derecha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N - 000${numero}`, 160, 55);
  doc.text(`Fecha: ${fechaHoy}`, 160, 60);

  // Datos cliente
   // Datos cliente en dos columnas
 const datosIzquierda = [
  ['Cliente:', cliente],
  ['RUT:', extras.rutCliente || '—'],
  ['Giro:', extras.giroCliente || '—'],
  ['Dirección:', extras.direccionCliente || '—'],
  ['Comuna:', extras.comunaCliente || '—'],
  ['Ciudad:', extras.ciudadCliente || 'Santiago'],
];

const datosDerecha = [
  ['At. Sr.:', extras.atencion || '—'],
  ['Válida:', '3 días'],
  ['Mail:', extras.emailCliente || '—'],
  ['Entrega:', extras.direccion || '—'],
  ['Cel.:', extras.telefonoCliente || '—'],
  ['Fecha Entrega:', extras.fechaEntrega || 'Por definir'],
  ['Pago:', extras.metodoPago || 'Contado'],
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
  autoTable(doc, {
    startY: yCliente  + 5,
    head: [['Item', 'Cant.', 'Descripción', 'Valor Unit.', 'Total']],
    body: productos.map((p, i) => [
      `${i + 1}°`,
      p.cantidad,
      p.nombre,
      `$${p.precio.toLocaleString('es-CL')}`,
      `$${p.total.toLocaleString('es-CL')}`,
    ]),
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [230, 230, 230] },
    columnStyles: {
      3: { halign: 'left' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });

  const subtotal = productos.reduce((acc, p) => acc + p.total, 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva;
  // @ts-expect-error
  const finalY = doc.lastAutoTable?.finalY || 100;

  // Totales tabla tipo Excel
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Neto.', 155, finalY + 10);
  doc.text(`$${subtotal.toLocaleString('es-CL')}`, 180, finalY + 10, { align: 'right' });

  doc.text('IVA.', 155, finalY + 16);
  doc.text(`$${iva.toLocaleString('es-CL')}`, 180, finalY + 16, { align: 'right' });

  doc.text('Total.', 155, finalY + 22);
  doc.text(`$${total.toLocaleString('es-CL')}`, 180, finalY + 22, { align: 'right' });

  // Forma de pago y nota
  let yNotas = finalY + 35;
  doc.setFont('helvetica', 'bold');
  doc.text('Forma de Pago:', 10, yNotas);
  doc.setFont('helvetica', 'normal');
  doc.text('65% Al inicio y 35% al momento de la entrega.', 50, yNotas);

  yNotas += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Nota:', 10, yNotas);
  doc.setFont('helvetica', 'normal');
  doc.text('Esta cotización es aceptada después de cancelado el 65%.', 50, yNotas);

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
  doc.textWithLink('comercialrasiva@gmail.com', 10, yNotas + 24, {
    url: 'mailto:comercialrasiva@gmail.com',
  });

  // Firma
   // doc.setTextColor(0, 0, 0);
  // doc.setFontSize(10);
  // doc.text('Ramón Silva Vásquez', 10, yNotas + 40);
  // doc.text('Comercial Rasiva Spa.', 10, yNotas + 45);
  // doc.setTextColor(0, 0, 255);
  

  return doc.output('blob');
}
