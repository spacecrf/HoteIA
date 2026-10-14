const Booking = require('../models/booking.model');
const Room = require('../models/room.model');

const createBooking = async (req, res) => {
  const { habitacion_id, fecha_entrada, fecha_salida, numero_huespedes } = req.body;
  const usuario_id = req.user.id;

  try {
    // 1. Obtener detalles de la habitación
    const room = await Room.findById(habitacion_id);
    if (!room) {
      return res.status(404).json({ msg: 'Habitación no encontrada' });
    }

    // 2. Verificar disponibilidad de nuevo antes de reservar (Critical Section)
    const isAvailable = await Room.getAvailable(fecha_entrada, fecha_salida, numero_huespedes);
    const roomIsAvailable = isAvailable.some(r => r.id === parseInt(habitacion_id));

    if (!roomIsAvailable) {
      return res.status(400).json({ msg: 'La habitación ya no está disponible para las fechas seleccionadas' });
    }

    // 3. Calcular costo total
    const entrada = new Date(fecha_entrada);
    const salida = new Date(fecha_salida);
    const diffTime = Math.abs(salida - entrada);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return res.status(400).json({ msg: 'La fecha de salida debe ser posterior a la de entrada' });
    }

    const costo_total = diffDays * room.precio_noche;

    // 4. Crear la reserva
    const bookingId = await Booking.create({
      usuario_id,
      habitacion_id,
      fecha_entrada,
      fecha_salida,
      numero_huespedes,
      costo_total,
      estado: 'confirmada' // Por defecto confirmada para el TFG (simulando pago exitoso)
    });

    res.json({ id: bookingId, msg: 'Reserva realizada con éxito', costo_total });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.getByUserId(req.user.id);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Reserva no encontrada' });
    }

    // Verificar que la reserva sea del usuario que la intenta cancelar
    if (booking.usuario_id !== req.user.id) {
      return res.status(401).json({ msg: 'No autorizado para cancelar esta reserva' });
    }

    await Booking.updateStatus(req.params.id, 'cancelada');
    res.json({ msg: 'Reserva cancelada con éxito' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.getAll();
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const stats = await Booking.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking, getAllBookings, getDashboardStats };
