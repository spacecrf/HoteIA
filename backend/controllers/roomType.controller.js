const RoomType = require('../models/roomType.model');

const getAll = async (req, res) => {
  try {
    const types = await RoomType.getAll();
    res.json(types);
  } catch (err) {
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ msg: 'Nombre de tipo requerido' });
    }
    const id = await RoomType.create(nombre.trim());
    res.json({ id, nombre });
  } catch (err) {
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await RoomType.delete(id);
    res.json({ msg: 'Tipo eliminado' });
  } catch (err) {
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

module.exports = { getAll, create, remove };
