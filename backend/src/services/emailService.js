const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendConfirmationEmail = async (toEmail, teacherName, roomName, date, timeSlot, grade) => {

    try {
        const mailOptions = {
            from: `"Sistema de Reservas - Salas de Cómputo" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: '¡Reserva de Sala de Cómputo Aprobada!',
            html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2563eb;">Hola, ${teacherName}</h2>
          <p>Te informamos que tu solicitud de préstamo para la <strong>${roomName}</strong> ha sido <strong>APROBADA</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <h3>Detalles de la reserva:</h3>
          <ul>
            <li><strong>Fecha:</strong> ${date}</li>
            <li><strong>Horario:</strong> ${timeSlot}</li>
            <li><strong>Grado:</strong> ${grade}</li>
          </ul>
          <p style="margin-top: 20px; font-size: 0.9em; color: #666;">Por favor puntualidad en la asistencia. ¡Que tengas un excelente día!</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de confirmación enviado exitosamente a ${toEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo electrónico:', error);
    }
};

module.exports = { sendConfirmationEmail };