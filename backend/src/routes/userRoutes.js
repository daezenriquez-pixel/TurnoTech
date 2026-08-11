const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Ajusta según la ruta de tu conexión a la base de datos

// GET: Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, role FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor al obtener usuarios' });
  }
});

// PUT: Actualizar un usuario por ID (contraseña directa en varchar)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, password } = req.body;

  try {
    if (password && password.trim() !== '') {
      await pool.query(
        'UPDATE users SET name = $1, email = $2, phone = $3, role = $4, password = $5 WHERE id = $6',
        [name, email, phone, role, password, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET name = $1, email = $2, phone = $3, role = $4 WHERE id = $5',
        [name, email, phone, role, id]
      );
    }

    res.json({ message: 'Usuario actualizado con éxito' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
});

// DELETE: Eliminar un usuario por ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Usuario eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
});

module.exports = router;