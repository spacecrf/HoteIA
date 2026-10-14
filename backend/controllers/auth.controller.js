const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, sub: google_id } = ticket.getPayload();

    let user = await User.findByGoogleId(google_id);

    if (!user) {
      user = await User.findByEmail(email);
      if (user) {
        // Actualizar usuario existente con google_id
        await User.updateGoogleId(user.id, google_id);
      } else {
        // Crear nuevo usuario
        const newUser = {
          nombre: name,
          email,
          google_id,
          rol_id: 1, // Rol de cliente por defecto
          password_hash: 'google_authenticated' // No se usará para login normal
        };
        const userId = await User.create(newUser);
        user = { id: userId };
      }
    }

    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Error Google Login', err);
    res.status(400).json({ msg: 'Token de Google no válido' });
  }
};

const register = async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    let user = await User.findByEmail(email);
    if (user) {
      return res.status(400).json({ msg: 'El usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = {
      nombre,
      email,
      password_hash,
      rol_id: 1, // Rol de cliente por defecto
    };

    const userId = await User.create(newUser);

    res.json({ msg: 'Usuario registrado con éxito' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales no válidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales no válidas' });
    }

    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

const getAuthenticatedUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

module.exports = { register, login, getAuthenticatedUser, googleLogin };
