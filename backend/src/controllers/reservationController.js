const pool = require('../config/db');
const { sendConfirmationEmail } = require('../services/emailService');

// Crear Reserva (Docente)
const createReservation = async (req, res) => {
    const { user_id, room_id, date, time_slot, grade } = req.body;

    try {
        // Validar máximo 2 citas por hora/fecha en total
        const countCheck = await pool.query(
            'SELECT COUNT(*) FROM reservations WHERE date = $1 AND time_slot = $2 AND status != \'rejected\'',
            [date, time_slot]
        );

        if (parseInt(countCheck.rows[0].count) >= 2) {
            return res.status(400).json({ error: 'No se permiten más de dos citas agendadas a la misma hora.' });
        }

        // Validar si la sala específica ya está ocupada
        const roomCheck = await pool.query(
            'SELECT * FROM reservations WHERE room_id = $1 AND date = $2 AND time_slot = $3 AND status != \'rejected\'',
            [room_id, date, time_slot]
        );

        if (roomCheck.rows.length > 0) {
            return res.status(400).json({ error: 'La sala seleccionada ya está ocupada en ese horario.' });
        }

        const newReservation = await pool.query(
            'INSERT INTO reservations (user_id, room_id, date, time_slot, grade, status) VALUES ($1, $2, $3, $4, $5, \'pending\') RETURNING *',
            [user_id, room_id, date, time_slot, grade]
        );

        res.status(201).json(newReservation.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

// Actualizar Estado de Reserva (Admin de Sala) y enviar correo si es aprobada
const updateReservationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' o 'rejected'

    try {
        const updated = await pool.query(
            'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        const reservation = updated.rows[0];

        // Si la reserva es aceptada, enviar el correo de confirmación al docente
        if (status === 'approved') {
            const userQuery = await pool.query('SELECT name, email FROM users WHERE id = $1', [reservation.user_id]);
            const user = userQuery.rows[0];

            const roomQuery = await pool.query('SELECT name FROM rooms WHERE id = $1', [reservation.room_id]);
            const room = roomQuery.rows[0];

            await sendConfirmationEmail(
                user.email,
                user.name,
                room.name,
                reservation.date,
                reservation.time_slot,
                reservation.grade
            );
        }

        res.json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

// Obtener todas las reservas
const getReservations = async (req, res) => {
    try {
        const query = `
      SELECT r.id, u.name as teacher_name, u.email as teacher_email, rm.name as room_name, r.date, r.time_slot, r.grade, r.status 
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN rooms rm ON r.room_id = rm.id
      ORDER BY r.date DESC;
    `;
        const allReservations = await pool.query(query);
        res.json(allReservations.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

module.exports = {
    createReservation,
    updateReservationStatus,
    getReservations,
};