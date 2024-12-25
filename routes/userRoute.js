const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/create',userController. createUser);
router.get('/findAll',userController.getAllUsers)
router.post('/generatePdf',userController.generatePdfForAllUsers)
router.get('/search-pdf/:name',userController.searchPDFByName)
module.exports = router;
