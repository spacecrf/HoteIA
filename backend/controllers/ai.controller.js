const AIService = require('../services/ai.service');
const AIModel = require('../models/ai.model');

const chatMessage = async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user ? req.user.id : null; // El usuario puede estar logueado o no

  if (!message || !sessionId) {
    return res.status(400).json({ msg: 'Faltan parámetros: message, sessionId' });
  }

  try {
    const response = await AIService.processChatMessage(userId, sessionId, message);
    res.json({ response });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor en el asistente IA' });
  }
};

const getHistory = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const history = await AIModel.getHistoryBySession(sessionId);
    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

module.exports = { chatMessage, getHistory };
