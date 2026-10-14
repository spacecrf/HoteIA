const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// @route   GET api/auth/user
// @desc    Obtener usuario autenticado
// @access  Private
router.get('/user', authMiddleware, authController.getAuthenticatedUser);

// @route   POST api/auth/register
// @desc    Registrar un nuevo usuario
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Iniciar sesión
// @access  Public
router.post('/login', authController.login);

// @route   POST api/auth/google
// @desc    Iniciar sesión con Google
// @access  Public
router.post('/google', authController.googleLogin);

module.exports = router;
