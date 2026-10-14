const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Room = require('../models/room.model');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');

const createCheckoutSession = async (req, res) => {
  const { habitacion_id, fecha_entrada, fecha_salida, numero_huespedes, extras = [] } = req.body;
  const usuario_id = req.user.id;

  try {
    const room = await Room.findById(habitacion_id);
    if (!room) {
      return res.status(404).json({ msg: 'Habitación no encontrada' });
    }

    // Calcular noches
    const entrada = new Date(fecha_entrada);
    const salida = new Date(fecha_salida);
    const diffTime = Math.abs(salida - entrada);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return res.status(400).json({ msg: 'La fecha de salida debe ser posterior a la de entrada' });
    }

    const extrasTotal = Array.isArray(extras) ? extras.reduce((sum, e) => sum + Number(e.price || 0), 0) : 0;
    const costo_total = diffDays * room.precio_noche + extrasTotal; // incluir extras

    // Si no hay API Key real de Stripe, simulamos el éxito para el TFG
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('tu_llave_secreta')) {
      console.log('Simulando checkout para TFG (Sin Stripe API Key)');
      
      // Idempotencia: comprobar si ya existe la reserva exacta
      const existing = await Booking.findExisting({ usuario_id, habitacion_id, fecha_entrada, fecha_salida });
      if (existing) {
        return res.json({ id: 'simulated_session_id', simulated: true, bookingId: existing.id });
      }

      // Creamos la reserva directamente para que el usuario vea el resultado
      const bookingId = await Booking.create({
        usuario_id,
        habitacion_id,
        fecha_entrada,
        fecha_salida,
        numero_huespedes,
        costo_total,
        estado: 'confirmada'
      });

      return res.json({ id: 'simulated_session_id', simulated: true, bookingId });
    }

    // Crear sesión de Stripe real
    const clientUrl = process.env.CLIENT_URL || (req.headers.origin + '/frontend') || 'http://localhost:5173';
    const user = await User.findById(usuario_id);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user?.email,
      billing_address_collection: 'auto',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Reserva Habitación ${room.numero_habitacion} - ${room.tipo_habitacion}`,
              description: `${diffDays} noches (${fecha_entrada} al ${fecha_salida})`,
            },
            unit_amount: Math.round(room.precio_noche * 100), // Stripe usa céntimos
          },
          quantity: diffDays,
        },
        ...extras.filter(e => Number(e.price) > 0).map(e => ({
          price_data: {
            currency: 'eur',
            product_data: { name: `Extra: ${e.name}` },
            unit_amount: Math.round(Number(e.price) * 100),
          },
          quantity: 1,
        }))
      ],
      mode: 'payment',
      success_url: `${clientUrl}/#/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/#/search`,
      metadata: {
        usuario_id: String(usuario_id),
        habitacion_id: String(habitacion_id),
        fecha_entrada: String(fecha_entrada),
        fecha_salida: String(fecha_salida),
        numero_huespedes: String(numero_huespedes),
        costo_total: String(costo_total),
        extras: JSON.stringify(extras),
        extras_total: String(extrasTotal)
      }
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Error al crear sesión de Stripe', err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const confirmPayment = async (req, res) => {
    const { session_id } = req.body;
  
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      if (session.payment_status === 'paid') {
        const { usuario_id, habitacion_id, fecha_entrada, fecha_salida, numero_huespedes, costo_total, extras } = session.metadata;
  
        // Idempotencia: evitar duplicados por reconfirmaciones
        const existing = await Booking.findExisting({ usuario_id, habitacion_id, fecha_entrada, fecha_salida });
        if (existing) {
          return res.json({ msg: 'Pago confirmado (idempotente)', bookingId: existing.id });
        }

        // Crear la reserva en la base de datos si no existe ya
        // En un sistema real, usaríamos webhooks de Stripe para esto,
        // pero para el TFG lo simplificamos aquí.
        const bookingId = await Booking.create({
          usuario_id,
          habitacion_id,
          fecha_entrada,
          fecha_salida,
          numero_huespedes,
          costo_total,
          estado: 'confirmada'
        });
  
        res.json({ msg: 'Pago confirmado y reserva creada', bookingId });
      } else {
        res.status(400).json({ msg: 'El pago no se ha completado' });
      }
    } catch (err) {
      console.error('Error al confirmar pago', err);
    res.status(500).json({ msg: 'Error del servidor' });
    }
  };

// Crear sesión de Stripe para configurar método de pago (modo prueba)
const createSetupSession = async (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';
    const user = await User.findById(req.user.id);
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      payment_method_types: ['card'],
      customer_email: user?.email,
      success_url: `${clientUrl}/dashboard?setup=success`,
      cancel_url: `${clientUrl}/dashboard?setup=cancel`,
    });
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Error al crear sesión de Setup en Stripe', err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

module.exports = { createCheckoutSession, confirmPayment, createSetupSession };
