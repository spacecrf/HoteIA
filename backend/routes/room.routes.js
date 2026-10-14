const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// @route   GET api/rooms
// @desc    Obtener todas las habitaciones
// @access  Public
router.get('/', roomController.getAllRooms);

// @route   POST api/rooms/available
// @desc    Obtener habitaciones disponibles por fecha y capacidad
// @access  Public
router.post('/available', roomController.getAvailableRooms);

// @route   POST api/rooms
// @desc    Crear habitación
// @access  Private/Admin
router.post('/', [authMiddleware, adminMiddleware], roomController.createRoom);

// @route   PUT api/rooms/:id
// @desc    Actualizar habitación
// @access  Private/Admin
router.put('/:id', [authMiddleware, adminMiddleware], roomController.updateRoom);

// @route   DELETE api/rooms/:id
// @desc    Eliminar habitación
// @access  Private/Admin
router.delete('/:id', [authMiddleware, adminMiddleware], roomController.deleteRoom);

module.exports = router;
