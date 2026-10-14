const db = require('../config/db');

const Booking = {};

Booking.create = async (bookingData) => {
  const { usuario_id, habitacion_id, fecha_entrada, fecha_salida, numero_huespedes, costo_total, estado } = bookingData;
  const [result] = await db.query(
    'INSERT INTO reservas (usuario_id, habitacion_id, fecha_entrada, fecha_salida, numero_huespedes, costo_total, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [usuario_id, habitacion_id, fecha_entrada, fecha_salida, numero_huespedes, costo_total, estado]
  );
  return result.insertId;
};

// Buscar reserva existente (idempotencia)
Booking.findExisting = async ({ usuario_id, habitacion_id, fecha_entrada, fecha_salida }) => {
  const [rows] = await db.query(
    "SELECT id FROM reservas WHERE usuario_id = ? AND habitacion_id = ? AND fecha_entrada = ? AND fecha_salida = ? AND estado = 'confirmada' LIMIT 1",
    [usuario_id, habitacion_id, fecha_entrada, fecha_salida]
  );
  return rows[0];
};

// Obtener todas las reservas de un usuario
Booking.getByUserId = async (userId) => {
  const query = `
    SELECT r.*, h.numero_habitacion, h.tipo_habitacion 
    FROM reservas r 
    JOIN habitaciones h ON r.habitacion_id = h.id 
    WHERE r.usuario_id = ? 
    ORDER BY r.created_at DESC
  `;
  const [rows] = await db.query(query, [userId]);
  return rows;
};

// Obtener todas las reservas (para admin)
Booking.getAll = async () => {
  const query = `
    SELECT r.*, h.numero_habitacion, u.nombre as nombre_usuario, u.email as email_usuario 
    FROM reservas r 
    JOIN habitaciones h ON r.habitacion_id = h.id 
    JOIN usuarios u ON r.usuario_id = u.id 
    ORDER BY r.fecha_entrada DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

Booking.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM reservas WHERE id = ?', [id]);
  return rows[0];
};

Booking.updateStatus = async (id, estado) => {
  await db.query('UPDATE reservas SET estado = ? WHERE id = ?', [estado, id]);
};

// Dashboard Stats: Reservas hoy, Ocupación, Ingresos totales
Booking.getDashboardStats = async () => {
  const stats = {};
  
  // Ingresos totales
  const [totalRevenue] = await db.query("SELECT SUM(costo_total) as total FROM reservas WHERE estado = 'confirmada'");
  stats.totalRevenue = totalRevenue[0].total || 0;

  // Reservas confirmadas
  const [totalBookings] = await db.query("SELECT COUNT(*) as count FROM reservas WHERE estado = 'confirmada'");
  stats.totalBookings = totalBookings[0].count;

  // Ocupación hoy
  const today = new Date().toISOString().split('T')[0];
  const [occupancy] = await db.query(
    "SELECT COUNT(*) as count FROM reservas WHERE ? BETWEEN fecha_entrada AND fecha_salida AND estado = 'confirmada'", 
    [today]
  );
  stats.todayOccupancy = occupancy[0].count;

  return stats;
};

module.exports = Booking;
