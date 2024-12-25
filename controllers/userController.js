const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const generatePDF = require('../utils/pdfGenerator');  
const User = require('../models/user'); 
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');

require('dotenv').config(); 
function generatePDF1(users) {
    const doc = new PDFDocument({ margin: 50 });
    const passThroughStream = new PassThrough();
    doc.pipe(passThroughStream);
    doc.fontSize(18).text('User Data', { align: 'center' });
    doc.moveDown();
    const tableStartX = 50;
    const tableStartY = doc.y + 20;
    const columnWidths = [200, 300]; 
    doc.fontSize(12).text('Name', tableStartX, tableStartY, { width: columnWidths[0], align: 'left' });
    doc.text('Email', tableStartX + columnWidths[0], tableStartY, { width: columnWidths[1], align: 'left' });
    doc.moveDown();
    doc.moveTo(tableStartX, tableStartY + 15).lineTo(tableStartX + columnWidths[0] + columnWidths[1], tableStartY + 15).stroke();
    let rowY = tableStartY + 20;
    users.forEach(user => {
      const { name = 'No Name', email = 'No Email' } = user;
      doc.text(name, tableStartX, rowY, { width: columnWidths[0], align: 'left' });
      doc.text(email, tableStartX + columnWidths[0], rowY, { width: columnWidths[1], align: 'left' });
      rowY += 20;
      doc.moveTo(tableStartX, rowY - 5).lineTo(tableStartX + columnWidths[0] + columnWidths[1], rowY - 5).stroke();
    });
    doc.end();
    return passThroughStream;
  }
  
const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }
    console.log("Bucket Name: ", process.env.S3_BUCKET_NAME);
    if (!process.env.S3_BUCKET_NAME) {
      console.error('S3_BUCKET_NAME is missing in environment variables.');
      return res.status(500).json({ message: 'S3_BUCKET_NAME is missing in environment variables.' });
    }
    const sanitizedFileName = name.trim().replace(/\s+/g, '_') + '.pdf'; 
    const passThroughStream = generatePDF({ name, email });
    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,  
      Key: `users/pdfs/${sanitizedFileName}`,
      Body: passThroughStream, 
      ContentType: 'application/pdf',
      ACL: 'public-read', 
    };
    console.log('Uploading PDF to S3 with parameters:', s3Params); 
    const uploadResult = await s3.upload(s3Params).promise();
    const user = await User.create({
      name,
      email,
      pdfUrl: uploadResult.Location,  
    });
    res.status(201).json({ message: 'User created successfully', user, pdfUrl: uploadResult.Location,s3Params });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};


const getAllUsers = async (req, res) => {
    try {
      const users = await User.find();  
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('Error fetching users');
    }
  };

  const generatePdfForAllUsers = async (req, res) => {
    try {
      const users = await User.find(); 
      if (!users || users.length === 0) {
        return res.status(400).json({ message: 'No users found.' });
      }
      console.log('Users fetched:', users);
      const passThroughStream = generatePDF1(users); 
      const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME, 
        Key: `users/pdfs/all_users_${Date.now()}.pdf`,
        Body: passThroughStream,
        ContentType: 'application/pdf',
        ACL: 'public-read',
      };
      const uploadResult = await s3.upload(s3Params).promise();
      res.status(201).json({
        message: 'PDF generated and saved to S3 successfully!',
        pdfUrl: uploadResult.Location,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: 'Error generating PDF', error });
    }
  };
  const searchPDFByName = async (req, res) => {
    try {
      const { name } = req.params;
  
      if (!name) {
        return res.status(400).json({ message: 'Name is required.' });
      }
      console.log("Searching for PDF in S3 for name:", name);
      const sanitizedFileName = name.trim().replace(/\s+/g, '_') + '.pdf'; 
      const s3Key = `users/pdfs/${sanitizedFileName}`;
  
      const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
      };

      try {
        await s3.headObject(s3Params).promise();
        const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
        res.status(200).json({ message: 'PDF found', pdfUrl: fileUrl });
      } catch (err) {
        if (err.code === 'NotFound') {
          console.error('PDF not found:', err);
          return res.status(404).json({ message: 'PDF not found for the given name.' });
        }
        throw err;
      }
    } catch (error) {
      console.error('Error searching for PDF:', error);
      res.status(500).json({ message: 'Internal server error', error });
    }
  };
  
  
  module.exports={
    createUser,
    getAllUsers,
    generatePdfForAllUsers,
    searchPDFByName
  }
  