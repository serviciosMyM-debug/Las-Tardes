const express = require('express');
const dayjs = require('dayjs');
const db = require('../db');

const router = express.Router();

function getSlotsForDate(dateString) {
  const date = dayjs(dateString, 'YYYY-MM-DD', true);
  if (!date.isValid()) return { valid: false, message: 'Fecha inválida.' };

  const blocked = db.findBlockedDate(dateString);
  if (blocked) return { valid: true, blocked: true, reason: blocked.reason || 'Fecha bloqueada.' };

  const availability = db.getAvailabilityByWeekday(date.day());
  if (!availability || !availability.enabled) {
    return { valid: true, blocked: true, reason: 'No hay atención para ese día.' };
  }

  const taken = db.getTakenSlots(dateString);
  const availableSlots = availability.slots.filter((slot) => !taken.includes(slot));
  return { valid: true, blocked: false, slots: availableSlots, taken };
}

router.get('/availability', (req, res) => {
  const { date } = req.query;
  const data = getSlotsForDate(date);
  if (!data.valid) return res.status(400).json(data);
  res.json(data);
});

router.post('/appointments', (req, res) => {
  const { name, phone, date, time, notes } = req.body;

  if (!name || !phone || !date || !time) {
    return res.status(400).json({ ok: false, message: 'Completá los campos obligatorios.' });
  }

  const dateCheck = dayjs(date, 'YYYY-MM-DD', true);
  if (!dateCheck.isValid()) {
    return res.status(400).json({ ok: false, message: 'La fecha indicada no es válida.' });
  }
  if (dateCheck.isBefore(dayjs().startOf('day'))) {
    return res.status(400).json({ ok: false, message: 'No podés reservar fechas pasadas.' });
  }

  const availability = getSlotsForDate(date);
  if (!availability.valid || availability.blocked) {
    return res.status(400).json({ ok: false, message: availability.reason || 'Fecha no disponible.' });
  }
  if (!availability.slots.includes(time)) {
    return res.status(400).json({ ok: false, message: 'Ese horario ya no está disponible.' });
  }

  const phoneClean = String(phone).replace(/[^\d+]/g, '').slice(0, 20);
  const notesSafe = (notes || '').trim().slice(0, 300);
  const appointment = db.createAppointment({
    name: name.trim().slice(0, 80),
    phone: phoneClean,
    date,
    time,
    notes: notesSafe
  });

  const business = db.getBusinessSettings();
  const message = [
    'Hola, quiero solicitar un turno.',
    `Nombre: ${appointment.name}`,
    `Teléfono: ${appointment.phone}`,
    `Fecha: ${appointment.date}`,
    `Horario: ${appointment.time}`,
    `Trabajo/consulta: ${appointment.notes || 'Sin observaciones'}`
  ].join('\n');
  const whatsappUrl = `https://wa.me/54${business.phone}?text=${encodeURIComponent(message)}`;

  res.json({ ok: true, message: 'Turno registrado correctamente.', appointmentId: appointment.id, whatsappUrl });
});

module.exports = router;
