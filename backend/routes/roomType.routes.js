const express = require('express');
const router = express.Router();
const controller = require('../controllers/roomType.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// Listar tipos
router.get('/', controller.getAll);

// Crear tipo (admin)
router.post('/', authMiddleware, adminMiddleware, controller.create);

// Eliminar tipo (admin)
router.delete('/:id', authMiddleware, adminMiddleware, controller.remove);

module.exports = router;
