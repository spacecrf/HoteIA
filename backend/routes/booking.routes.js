const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// @route   POST api/bookings
// @desc    Crear una reserva
// @access  Private (Cualquier usuario logueado)
router.post('/', authMiddleware, bookingController.createBooking);

// @route   GET api/bookings/my
// @desc    Obtener reservas del usuario logueado
// @access  Private
router.get('/my', authMiddleware, bookingController.getMyBookings);

// @route   DELETE api/bookings/:id
// @desc    Cancelar una reserva del usuario
// @access  Private
router.delete('/:id', authMiddleware, bookingController.cancelBooking);

// @route   GET api/bookings/all
// @desc    Obtener todas las reservas (Admin)
// @access  Private/Admin
router.get('/all', [authMiddleware, adminMiddleware], bookingController.getAllBookings);

// @route   GET api/bookings/stats
// @desc    Estadísticas para dashboard (Admin)
// @access  Private/Admin
router.get('/stats', [authMiddleware, adminMiddleware], bookingController.getDashboardStats);

module.exports = router;
