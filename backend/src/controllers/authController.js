const pool = require('../config/db');

// Iniciar sesión
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas (correo no encontrado)' });
    }
    
    const user = userQuery.rows[0];
    
    // Comparación directa (en producción se recomienda usar bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Crear Administrador de Sala (Ejecutado por el Superusuario)
const createAdmin = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, \'room_admin\') RETURNING id, name, email, role, phone',
      [name, email, password, phone]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al crear el administrador');
  }
};

// Registrar Usuario general (Docentes u otros roles)
// En tu authController.js (asegúrate de que sea similar a esto):
const registerUser = async (req, res) => {
    const { name, email, password, phone, role } = req.body;
    try {
        // Si no mandan un rol, por defecto asignamos 'teacher'
        const userRole = role || 'teacher'; 
        await pool.query(
            'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)',
            [name, email, password, phone, userRole]
        );
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

module.exports = {
  login,
  createAdmin,
  registerUser
};