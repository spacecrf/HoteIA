const Room = require('../models/room.model');

const getAllRooms = async (req, res) => {
  try {
    const { capacidad, precioMax } = req.query;
    const filters = { capacidad, precioMax };
    const rooms = await Room.getAll(filters);
    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const getAvailableRooms = async (req, res) => {
  try {
    const { fechaEntrada, fechaSalida, capacidad } = req.body;
    
    if (!fechaEntrada || !fechaSalida || !capacidad) {
      return res.status(400).json({ msg: 'Faltan parámetros: fechaEntrada, fechaSalida, capacidad' });
    }

    const availableRooms = await Room.getAvailable(fechaEntrada, fechaSalida, capacidad);
    res.json(availableRooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const createRoom = async (req, res) => {
  try {
    const roomId = await Room.create(req.body);
    res.json({ id: roomId, msg: 'Habitación creada con éxito' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const updateRoom = async (req, res) => {
  try {
    await Room.update(req.params.id, req.body);
    res.json({ msg: 'Habitación actualizada con éxito' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const deleteRoom = async (req, res) => {
  try {
    await Room.delete(req.params.id);
    res.json({ msg: 'Habitación eliminada con éxito' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

module.exports = { getAllRooms, getAvailableRooms, createRoom, updateRoom, deleteRoom };
