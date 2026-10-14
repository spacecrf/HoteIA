const User = require('../models/user.model');

module.exports = async function (req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (user.rol_id !== 2) {
      return res.status(403).json({ msg: 'Acceso denegado: Se requiere rol de administrador' });
    }
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
