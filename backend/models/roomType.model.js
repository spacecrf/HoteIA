const db = require('../config/db');

const RoomType = {};

const ensureTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tipos_habitacion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    // ignore
  }
};

RoomType.getAll = async () => {
  await ensureTable();
  const [rows] = await db.query('SELECT * FROM tipos_habitacion ORDER BY nombre ASC');
  return rows;
};

RoomType.create = async (nombre) => {
  await ensureTable();
  const [result] = await db.query('INSERT INTO tipos_habitacion (nombre) VALUES (?)', [nombre]);
  return result.insertId;
};

RoomType.delete = async (id) => {
  await ensureTable();
  await db.query('DELETE FROM tipos_habitacion WHERE id = ?', [id]);
};

module.exports = RoomType;
