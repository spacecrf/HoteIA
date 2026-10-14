const db = require('../config/db');

const User = {};

User.create = async (userData) => {
  const { nombre, email, password_hash, rol_id, google_id } = userData;
  const [result] = await db.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol_id, google_id) VALUES (?, ?, ?, ?, ?)',
    [nombre, email, password_hash, rol_id, google_id || null]
  );
  return result.insertId;
};

User.findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0];
};

User.findByGoogleId = async (googleId) => {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE google_id = ?', [googleId]);
  return rows[0];
};

User.updateGoogleId = async (id, googleId) => {
  await db.query('UPDATE usuarios SET google_id = ? WHERE id = ?', [googleId, id]);
};

User.updateProfile = async (id, { nombre }) => {
  await db.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, id]);
};

User.findById = async (id) => {
  const [rows] = await db.query('SELECT id, nombre, email, rol_id FROM usuarios WHERE id = ?', [id]);
  return rows[0];
};

module.exports = User;
