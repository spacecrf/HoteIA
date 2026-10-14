const db = require('../config/db');

const Room = {};

// Asegurar columna opcional para foto
const ensurePhotoColumn = async () => {
  try {
    await db.query('ALTER TABLE habitaciones ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255) NULL');
  } catch (e) {
    // Si la versión de MySQL no soporta IF NOT EXISTS, intentamos detectar la columna
    try {
      const [cols] = await db.query("SHOW COLUMNS FROM habitaciones LIKE 'photo_url'");
      if (!cols || cols.length === 0) {
        await db.query('ALTER TABLE habitaciones ADD COLUMN photo_url VARCHAR(255) NULL');
      }
    } catch (err) {
      // Ignorar si no se puede alterar; el sistema seguirá usando imagen por defecto
    }
  }
};

// Obtener todas las habitaciones (con filtros opcionales)
Room.getAll = async (filters = {}) => {
  let query = 'SELECT * FROM habitaciones WHERE 1=1';
  const queryParams = [];

  if (filters.capacidad) {
    query += ' AND capacidad >= ?';
    queryParams.push(filters.capacidad);
  }

  if (filters.precioMax) {
    query += ' AND precio_noche <= ?';
    queryParams.push(filters.precioMax);
  }

  const [rows] = await db.query(query, queryParams);
  return rows;
};

// Obtener habitaciones disponibles en un rango de fechas
Room.getAvailable = async (fechaEntrada, fechaSalida, capacidad) => {
  const query = `
    SELECT * FROM habitaciones 
    WHERE capacidad >= ? 
    AND id NOT IN (
      SELECT habitacion_id FROM reservas 
      WHERE estado != 'cancelada' 
      AND NOT (
        fecha_salida <= ? OR fecha_entrada >= ?
      )
    )
  `;
  const [rows] = await db.query(query, [capacidad, fechaEntrada, fechaSalida]);
  return rows;
};

Room.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM habitaciones WHERE id = ?', [id]);
  return rows[0];
};

Room.create = async (roomData) => {
  await ensurePhotoColumn();
  const { numero_habitacion, tipo_habitacion, descripcion, capacidad, precio_noche, photo_url } = roomData;
  const [result] = await db.query(
    'INSERT INTO habitaciones (numero_habitacion, tipo_habitacion, descripcion, capacidad, precio_noche, photo_url) VALUES (?, ?, ?, ?, ?, ?)',
    [numero_habitacion, tipo_habitacion, descripcion, capacidad, precio_noche, photo_url || null]
  );
  return result.insertId;
};

Room.update = async (id, roomData) => {
  await ensurePhotoColumn();
  const { numero_habitacion, tipo_habitacion, descripcion, capacidad, precio_noche, photo_url } = roomData;
  await db.query(
    'UPDATE habitaciones SET numero_habitacion = ?, tipo_habitacion = ?, descripcion = ?, capacidad = ?, precio_noche = ?, photo_url = ? WHERE id = ?',
    [numero_habitacion, tipo_habitacion, descripcion, capacidad, precio_noche, photo_url || null, id]
  );
};

Room.delete = async (id) => {
  await db.query('DELETE FROM habitaciones WHERE id = ?', [id]);
};

module.exports = Room;
