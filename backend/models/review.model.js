const db = require('../config/db');

const Review = {};

const ensureTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS resenas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      habitacion_id INT NOT NULL,
      rating TINYINT NOT NULL,
      comentario TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_room (usuario_id, habitacion_id)
    )
  `);
};

Review.upsert = async ({ usuario_id, habitacion_id, rating, comentario }) => {
  await ensureTable();
  const [rows] = await db.query(
    'SELECT id FROM resenas WHERE usuario_id = ? AND habitacion_id = ?',
    [usuario_id, habitacion_id]
  );
  if (rows.length > 0) {
    await db.query(
      'UPDATE resenas SET rating = ?, comentario = ? WHERE id = ?',
      [rating, comentario || null, rows[0].id]
    );
    return rows[0].id;
  } else {
    const [result] = await db.query(
      'INSERT INTO resenas (usuario_id, habitacion_id, rating, comentario) VALUES (?, ?, ?, ?)',
      [usuario_id, habitacion_id, rating, comentario || null]
    );
    return result.insertId;
  }
};

Review.getStatsByRoom = async (habitacion_id) => {
  await ensureTable();
  const [rows] = await db.query(
    'SELECT COUNT(*) as count, AVG(rating) as avg FROM resenas WHERE habitacion_id = ?',
    [habitacion_id]
  );
  return { count: rows[0].count || 0, avg: rows[0].avg ? Number(rows[0].avg).toFixed(1) : null };
};

module.exports = Review;
