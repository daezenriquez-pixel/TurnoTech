const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // O la ruta correcta a tu archivo db.js

// RUTA: Obtener todas las reservas con el nombre del docente y de la sala
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.*, 
        u.name AS teacher_name, 
        rooms.name AS room_name 
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN rooms ON r.room_id = rooms.id
      ORDER BY r.created_at DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: error.message });
  }
});

// NUEVA RUTA: Actualizar estado de la reserva (Aceptar / Rechazar)
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' o 'rejected'

  try {
    await pool.query('BEGIN');

    const getResQuery = 'SELECT * FROM reservations WHERE id = $1';
    const resResult = await pool.query(getResQuery, [id]);

    if (resResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const { room_id, date, time_slot } = resResult.rows[0];

    if (status === 'approved') {
      const rejectOthersQuery = `
        UPDATE reservations 
        SET status = 'rejected' 
        WHERE room_id = $1 
          AND date = $2 
          AND time_slot = $3 
          AND id != $4 
          AND status = 'pending';
      `;
      await pool.query(rejectOthersQuery, [room_id, date, time_slot, id]);
    }

    const updateQuery = `
      UPDATE reservations 
      SET status = $1 
      WHERE id = $2 
      RETURNING *;
    `;
    await pool.query(updateQuery, [status, id]);

    await pool.query('COMMIT');

    res.json({ message: 'Reserva gestionada y solicitudes pendientes rechazadas correctamente' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error al gestionar el estado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// RUTA: Crear una nueva reserva con la nueva regla de validación
router.post('/', async (req, res) => {
  const { user_id, room_id, date, time_slot, grade } = req.body;

  try {
    const approvedQuery = `
      SELECT r.*, u.name AS teacher_name 
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE r.room_id = $1 
        AND r.date = $2 
        AND r.time_slot = $3 
        AND r.status = 'approved'
    `;
    const approvedResult = await pool.query(approvedQuery, [room_id, date, time_slot]);

    if (approvedResult.rows.length > 0) {
      const teacherName = approvedResult.rows[0].teacher_name;
      return res.status(400).json({ 
        message: `La sala ya se encuentra aprobada para esta fecha y horario por el docente ${teacherName}.` 
      });
    }

    const pendingSameUserQuery = `
      SELECT * FROM reservations 
      WHERE room_id = $1 
        AND date = $2 
        AND time_slot = $3 
        AND status = 'pending'
        AND user_id = $4
    `;
    const pendingSameUserResult = await pool.query(pendingSameUserQuery, [room_id, date, time_slot, user_id]);

    if (pendingSameUserResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Ya tienes una solicitud pendiente para esta sala, fecha y horario.' 
      });
    }

    const insertQuery = `
      INSERT INTO reservations (user_id, room_id, date, time_slot, grade, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *;
    `;
    const values = [user_id, room_id, date, time_slot, grade];
    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      message: 'Reserva solicitada con éxito',
      reservation: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear la reserva:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear la reserva' });
  }
});

// RUTA: Eliminar/Cancelar una reserva
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id, user_role } = req.body;

  try {
    const checkQuery = 'SELECT * FROM reservations WHERE id = $1';
    const result = await pool.query(checkQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const reservation = result.rows[0];

    if (reservation.status === 'approved' && user_role === 'teacher') {
      return res.status(403).json({ message: 'No puedes cancelar una reserva ya aprobada. Contacta al administrador.' });
    }

    if (user_role === 'teacher' && reservation.user_id !== parseInt(user_id)) {
      return res.status(403).json({ message: 'No tienes permiso para cancelar esta reserva.' });
    }

    await pool.query('DELETE FROM reservations WHERE id = $1', [id]);

    res.json({ message: 'Reserva cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar:', error);
    res.status(500).json({ message: 'Error al procesar la cancelación' });
  }
});

// CORREGIDO: Obtener reservas activas con los JOINs de profesor y sala
router.get('/active', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT 
        r.*, 
        u.name AS teacher_name, 
        rooms.name AS room_name 
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN rooms ON r.room_id = rooms.id
      WHERE r.date >= $1 
      ORDER BY r.date ASC
    `;
    const result = await pool.query(query, [today]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al cargar reservas activas:', error);
    res.status(500).json({ message: 'Error al cargar reservas activas' });
  }
});

// CORREGIDO: Obtener historial con los JOINs de profesor y sala
router.get('/history', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT 
        r.*, 
        u.name AS teacher_name, 
        rooms.name AS room_name 
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN rooms ON r.room_id = rooms.id
      WHERE r.date < $1 
      ORDER BY r.date DESC
    `;
    const result = await pool.query(query, [today]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al cargar historial:', error);
    res.status(500).json({ message: 'Error al cargar historial' });
  }
});

// Obtener reservas activas (hoy o futuras) de un profesor específico
router.get('/teacher/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT r.*, rm.name as room_name 
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.user_id = $1 AND r.date >= $2 
      ORDER BY r.date ASC
    `;
    const result = await pool.query(query, [userId, today]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reservas activas del profesor' });
  }
});

// Obtener el historial de reservas pasadas de un profesor específico
router.get('/teacher/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT r.*, rm.name as room_name 
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      WHERE r.user_id = $1 AND r.date < $2 
      ORDER BY r.date DESC
    `;
    const result = await pool.query(query, [userId, today]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial del profesor' });
  }
});

module.exports = router;