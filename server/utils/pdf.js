const { jsPDF } = require('jspdf');
require('jspdf-autotable'); // solo require para extender jsPDF
const fs = require('fs');
const path = require('path');

// Ruta logo base64
const logoPath = path.join(__dirname, '../../client/src/assets/logo-rasiva.png');
const logoBase64 = fs.existsSync(logoPath)
  ? fs.readFileSync(logoPath, 'base64')
  : null;

function generarGuiaPDF(cliente, productos, extras) {
  console.log("🔥 GENERANDO PDF");
  console.log(extras);
  console.log(
    "PDF FORMA PAGO:",
    extras.formaPago
  );

  console.log(
    "PDF NOTA:",
    extras.nota
  );
  const doc = new jsPDF();
  const fechaHoy = new Date().toLocaleDateString('es-CL');
  const numero =
    extras.numero ??
    extras.numeroDocumento ??
    0;
  console.log(
    "PDF FORMA PAGO:",
    extras.formaPago
  );

  console.log(
    "PDF NOTA:",
    extras.nota
  );
  console.log("PDF NUMERO:", numero);
  console.log("PDF EXTRAS:", extras);
  const unidadBonita = {
    unidad: 'Un.',
    m3: 'm³',
    tonelada: 'Ton.',
    metro_lineal: 'M.L.'
  };
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30);
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Sergio Silva Leal.', 45, 15);
  doc.setFont('helvetica', 'normal');
  doc.text('RUT: 77 143 635-8', 45, 20);
  doc.text('Compra y Venta de Aridos y materiales de construccion', 45, 25);
  doc.text('Construcción y Transportes.', 45, 30);
  doc.text("Fono: (02) Cel. 9 5411 1065 - 9 3758 9348", 45, 35);
  doc.text('Dirección: Balmaceda N°01091, Malloco - Peñaflor', 45, 40);

  let tituloPDF = 'Documento';
  if (extras.tipo === 'cotizacion') tituloPDF = 'Cotización';
  else if (extras.tipo === 'nota') tituloPDF = 'Nota de Venta';
  else if (extras.tipo === 'guia') tituloPDF = 'Guía de Despacho';

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(tituloPDF, 105, 50, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `N° ${String(numero || 0).padStart(6, '0')}`,
    160,
    55
  );
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
    const [labelDer, valueDer] = datosDerecha[i] || ['', ''];

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

  doc.autoTable({
    startY: yCliente + 5,
    head: [['Código', 'Cant.', 'Unidad', 'Descripción', 'Valor Unit.', 'Total']],
    body: productos.map((p) => [
      p.codigo || '---',
      Number(p.cantidad).toLocaleString('es-CL'),
      unidadBonita[p.unidad] || p.unidad || 'Un.',
      p.nombre,
      `$${Number(p.precio).toLocaleString('es-CL')}`,
      `$${Number(p.total).toLocaleString('es-CL')}`,
    ]),
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [230, 230, 230] },
    columnStyles: {
      0: { halign: 'center' }, // código
      1: { halign: 'center' }, // cantidad
      2: { halign: 'center' }, // unidad
      3: { halign: 'left' },   // descripción
      4: { halign: 'right' },  // precio
      5: { halign: 'right' },  // total
    },
  });

  const subtotal = productos.reduce((acc, p) => acc + p.total, 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  const finalY = doc.lastAutoTable.finalY || 120;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Neto.', 155, finalY + 10);
  doc.text(`$${subtotal.toLocaleString('es-CL')}`, 180, finalY + 10, { align: 'right' });

  doc.text('IVA.', 155, finalY + 16);
  doc.text(`$${iva.toLocaleString('es-CL')}`, 180, finalY + 16, { align: 'right' });

  doc.text('Total.', 155, finalY + 22);
  doc.text(`$${total.toLocaleString('es-CL')}`, 180, finalY + 22, { align: 'right' });

  let yNotas = finalY + 35;
  doc.setFont('helvetica', 'bold');
  doc.text('Forma de Pago:', 10, yNotas);

  doc.setFont('helvetica', 'normal');

  doc.text(
    extras.formaPago || '__________________',
    50,
    yNotas
  );

  yNotas += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Nota:', 10, yNotas);

  doc.setFont('helvetica', 'normal');
  doc.text(
    extras.nota || '__________________',
    50,
    yNotas,
    {
      maxWidth: 130
    }
  );

  yNotas += 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 0, 0);
  doc.text('Transferir a:', 10, yNotas);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Sergio Silva Leal', 10, yNotas + 6);
  doc.text('Cheq Electronica N°3557 0328 261 Bco.Estado', 10, yNotas + 12);
  doc.text('Rut. 5 586 794-1', 10, yNotas + 18);
  doc.setTextColor(0, 0, 255);
  doc.textWithLink('silvalealsergio@gmail.com', 10, yNotas + 24, {
    url: 'mailto:silvalealsergio@gmail.com',
  });

  console.log("FINAL Y:", finalY);
  console.log("Y NOTAS:", yNotas);

  return Buffer.from(doc.output('arraybuffer'));
}

module.exports = { generarGuiaPDF };
