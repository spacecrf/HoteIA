const express = require('express');
const router = express.Router();
const controller = require('../controllers/review.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/', auth, controller.addOrUpdate);
router.get('/by-room/:habitacion_id', controller.getStats);

module.exports = router;
