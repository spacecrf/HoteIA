const db = require('../config/db');

const AI = {};

AI.saveMessage = async (usuario_id, session_id, mensaje, respuesta) => {
  try {
    const [result] = await db.query(
      'INSERT INTO conversaciones_ia (usuario_id, session_id, mensaje, respuesta) VALUES (?, ?, ?, ?)',
      [usuario_id || null, session_id, mensaje, respuesta]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error saving AI message:', error);
    throw error;
  }
};

AI.getHistoryBySession = async (session_id) => {
  const [rows] = await db.query(
    'SELECT mensaje, respuesta, created_at FROM conversaciones_ia WHERE session_id = ? ORDER BY created_at ASC',
    [session_id]
  );
  return rows;
};

module.exports = AI;
