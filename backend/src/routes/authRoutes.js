const express = require('express');
const router = express.Router();
const { login, createAdmin, registerUser } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', registerUser);
router.post('/admin/create', createAdmin); // Endpoint exclusivo para el superusuario

module.exports = router;