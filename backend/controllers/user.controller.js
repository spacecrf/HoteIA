const User = require('../models/user.model');

const updateUserProfile = async (req, res) => {
  const { nombre } = req.body;
  const userId = req.user.id;

  try {
    await User.updateProfile(userId, { nombre });
    res.json({ msg: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

module.exports = { updateUserProfile };
