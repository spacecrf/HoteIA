const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const jwt = require('jsonwebtoken');

// Middleware opcional para detectar usuario en el chat (sin bloquear si no está)
const optionalAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
    } catch (err) {
      // Ignoramos errores, el usuario simplemente será null
    }
  }
  next();
};

// @route   POST api/ai/chat
// @desc    Enviar mensaje al asistente de IA
// @access  Public (con auth opcional)
router.post('/chat', optionalAuth, aiController.chatMessage);

// @route   GET api/ai/history/:sessionId
// @desc    Obtener historial del chat por sesión
// @access  Public
router.get('/history/:sessionId', aiController.getHistory);

module.exports = router;
