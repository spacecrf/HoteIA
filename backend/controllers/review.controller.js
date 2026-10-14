const Review = require('../models/review.model');

const addOrUpdate = async (req, res) => {
  try {
    const { habitacion_id, rating, comentario } = req.body;
    if (!habitacion_id || !rating) {
      return res.status(400).json({ msg: 'Faltan datos' });
    }
    const id = await Review.upsert({
      usuario_id: req.user.id,
      habitacion_id,
      rating: Math.max(1, Math.min(5, Number(rating))),
      comentario: comentario || null
    });
    res.json({ id });
  } catch (err) {
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const getStats = async (req, res) => {
  try {
    const { habitacion_id } = req.params;
    const stats = await Review.getStatsByRoom(habitacion_id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

module.exports = { addOrUpdate, getStats };
