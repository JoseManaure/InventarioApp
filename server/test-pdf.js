// test-pdf.js
const fs = require('fs');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

function crearPDF() {
  const doc = new jsPDF();

  doc.text('Prueba jsPDF con autoTable', 10, 10);

  doc.autoTable({
    head: [['ID', 'Nombre', 'Cantidad']],
    body: [
      [1, 'Manzanas', 5],
      [2, 'Naranjas', 10],
      [3, 'Peras', 7],
    ],
    startY: 20,
  });

  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync('prueba.pdf', Buffer.from(pdfBytes));
  console.log('PDF creado: prueba.pdf');
}

crearPDF();
