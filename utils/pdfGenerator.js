const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');

function generatePDF(data) {
  const { name, email } = data;
  const doc = new PDFDocument();
  const passThroughStream = new PassThrough(); 
   
  doc.pipe(passThroughStream);
  doc.text(`Name: ${name}`);
  doc.text(`Email: ${email}`);
  doc.end();
  return passThroughStream;
}

module.exports = generatePDF;
