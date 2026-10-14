const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// @route   PUT api/users/profile
// @desc    Actualizar perfil de usuario
// @access  Private
router.put('/profile', authMiddleware, userController.updateUserProfile);

module.exports = router;
