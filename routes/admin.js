const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.render('admin-login', {
    toast: req.query.toast || '',
    toastType: req.query.type || 'success'
  });
});

router.post('/login', (req, res) => {
  const admin = db.authenticateAdmin(req.body.username, req.body.password);
  if (!admin) {
    return res.redirect('/admin/login?toast=Credenciales inválidas&type=error');
  }
  req.session.admin = { id: admin.id, username: admin.username };
  res.redirect('/admin?toast=Bienvenido al panel&type=success');
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login?toast=Sesión cerrada&type=success'));
});

router.get('/', requireAuth, (req, res) => {
  const availability = db.listAvailability().map((item) => ({
    ...item,
    parsedSlots: item.slots.join(', ')
  }));

  res.render('admin-dashboard', {
    admin: req.session.admin,
    settings: db.getBusinessSettings(),
    appointments: db.listAppointments(),
    upcomingAppointments: db.getUpcomingAppointments(),
    reviews: db.listReviews(),
    pricing: db.listPricing(),
    availability,
    blockedDates: db.listBlockedDates(),
    summary: db.getSummary(),
    toast: req.query.toast || '',
    toastType: req.query.type || 'success'
  });
});

router.post('/settings', requireAuth, (req, res) => {
  db.updateBusinessSettings(req.body);
  res.redirect('/admin?toast=Contenido general actualizado&type=success');
});

router.post('/appointments/:id/status', requireAuth, (req, res) => {
  db.updateAppointmentStatus(req.params.id, req.body.status);
  res.redirect('/admin?toast=Estado del turno actualizado&type=success#turnos');
});

router.post('/appointments/:id/delete', requireAuth, (req, res) => {
  db.deleteAppointment(req.params.id);
  res.redirect('/admin?toast=Turno eliminado&type=success#turnos');
});

router.post('/availability/update', requireAuth, (req, res) => {
  const days = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    weekday: day,
    enabled: Boolean(req.body[`enabled_${day}`]),
    slots: String(req.body[`slots_${day}`] || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }));
  db.updateAvailability(days);
  res.redirect('/admin?toast=Disponibilidad actualizada&type=success#disponibilidad');
});

router.post('/blocked-dates', requireAuth, (req, res) => {
  try {
    db.addBlockedDate({ date: req.body.date, reason: req.body.reason || '' });
    res.redirect('/admin?toast=Fecha bloqueada correctamente&type=success#disponibilidad');
  } catch (error) {
    res.redirect('/admin?toast=Esa fecha ya está bloqueada&type=error#disponibilidad');
  }
});

router.post('/blocked-dates/:id/delete', requireAuth, (req, res) => {
  db.deleteBlockedDate(req.params.id);
  res.redirect('/admin?toast=Fecha desbloqueada&type=success#disponibilidad');
});

router.post('/reviews', requireAuth, (req, res) => {
  db.createReview({ client_name: req.body.client_name, comment: req.body.comment, rating: Number(req.body.rating) });
  res.redirect('/admin?toast=Reseña agregada&type=success#resenas');
});

router.post('/reviews/:id/update', requireAuth, (req, res) => {
  db.updateReview(req.params.id, { client_name: req.body.client_name, comment: req.body.comment, rating: Number(req.body.rating) });
  res.redirect('/admin?toast=Reseña actualizada&type=success#resenas');
});

router.post('/reviews/:id/delete', requireAuth, (req, res) => {
  db.deleteReview(req.params.id);
  res.redirect('/admin?toast=Reseña eliminada&type=success#resenas');
});

router.post('/pricing', requireAuth, (req, res) => {
  db.createPricing({ name: req.body.name, description: req.body.description, price: req.body.price, sort_order: Number(req.body.sort_order || 0) });
  res.redirect('/admin?toast=Servicio/presupuesto agregado&type=success#precios');
});

router.post('/pricing/:id/update', requireAuth, (req, res) => {
  db.updatePricing(req.params.id, { name: req.body.name, description: req.body.description, price: req.body.price, sort_order: Number(req.body.sort_order || 0) });
  res.redirect('/admin?toast=Elemento actualizado&type=success#precios');
});

router.post('/pricing/:id/delete', requireAuth, (req, res) => {
  db.deletePricing(req.params.id);
  res.redirect('/admin?toast=Elemento eliminado&type=success#precios');
});

module.exports = router;
