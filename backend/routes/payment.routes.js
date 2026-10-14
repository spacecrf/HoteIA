const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// @route   POST api/payments/create-checkout-session
// @desc    Crear sesión de pago en Stripe
// @access  Private
router.post('/create-checkout-session', authMiddleware, paymentController.createCheckoutSession);

// @route   POST api/payments/confirm
// @desc    Confirmar pago tras el redirect de Stripe
// @access  Private
router.post('/confirm', authMiddleware, paymentController.confirmPayment);

// @route   POST api/payments/setup-method
// @desc    Crear sesión de Stripe (Setup) para añadir método de pago
// @access  Private
router.post('/setup-method', authMiddleware, paymentController.createSetupSession);

module.exports = router;
