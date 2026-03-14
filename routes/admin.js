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

router.post('/login', async (req, res, next) => {
  try {
    const admin = await db.authenticateAdmin(req.body.username, req.body.password);
    if (!admin) {
      return res.redirect('/admin/login?toast=Credenciales inválidas&type=error');
    }
    req.session.admin = { id: admin.id, username: admin.username };
    res.redirect('/admin?toast=Bienvenido al panel&type=success');
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login?toast=Sesión cerrada&type=success'));
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [settings, appointments, upcomingAppointments, reviews, pricing, blockedDates, summary, availabilityBase] = await Promise.all([
      db.getBusinessSettings(),
      db.listAppointments(),
      db.getUpcomingAppointments(),
      db.listReviews(),
      db.listPricing(),
      db.listBlockedDates(),
      db.getSummary(),
      db.listAvailability()
    ]);

    const availability = availabilityBase.map((item) => ({
      ...item,
      parsedSlots: item.slots.join(', ')
    }));

    res.render('admin-dashboard', {
      admin: req.session.admin,
      settings,
      appointments,
      upcomingAppointments,
      reviews,
      pricing,
      availability,
      blockedDates,
      summary,
      toast: req.query.toast || '',
      toastType: req.query.type || 'success'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/settings', requireAuth, async (req, res, next) => {
  try {
    await db.updateBusinessSettings(req.body);
    res.redirect('/admin?toast=Contenido general actualizado&type=success');
  } catch (error) {
    next(error);
  }
});

router.post('/appointments/:id/status', requireAuth, async (req, res, next) => {
  try {
    await db.updateAppointmentStatus(req.params.id, req.body.status);
    res.redirect('/admin?toast=Estado del turno actualizado&type=success#turnos');
  } catch (error) {
    next(error);
  }
});

router.post('/appointments/:id/delete', requireAuth, async (req, res, next) => {
  try {
    await db.deleteAppointment(req.params.id);
    res.redirect('/admin?toast=Turno eliminado&type=success#turnos');
  } catch (error) {
    next(error);
  }
});

router.post('/availability/update', requireAuth, async (req, res, next) => {
  try {
    const days = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      weekday: day,
      enabled: Boolean(req.body[`enabled_${day}`]),
      slots: String(req.body[`slots_${day}`] || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }));

    await db.updateAvailability(days);
    res.redirect('/admin?toast=Disponibilidad actualizada&type=success#disponibilidad');
  } catch (error) {
    next(error);
  }
});

router.post('/blocked-dates', requireAuth, async (req, res) => {
  try {
    await db.addBlockedDate({ date: req.body.date, reason: req.body.reason || '' });
    res.redirect('/admin?toast=Fecha bloqueada correctamente&type=success#disponibilidad');
  } catch (error) {
    res.redirect('/admin?toast=Esa fecha ya está bloqueada&type=error#disponibilidad');
  }
});

router.post('/blocked-dates/:id/delete', requireAuth, async (req, res, next) => {
  try {
    await db.deleteBlockedDate(req.params.id);
    res.redirect('/admin?toast=Fecha desbloqueada&type=success#disponibilidad');
  } catch (error) {
    next(error);
  }
});

router.post('/reviews', requireAuth, async (req, res, next) => {
  try {
    await db.createReview({
      client_name: req.body.client_name,
      comment: req.body.comment,
      rating: Number(req.body.rating)
    });
    res.redirect('/admin?toast=Reseña agregada&type=success#resenas');
  } catch (error) {
    next(error);
  }
});

router.post('/reviews/:id/update', requireAuth, async (req, res, next) => {
  try {
    await db.updateReview(req.params.id, {
      client_name: req.body.client_name,
      comment: req.body.comment,
      rating: Number(req.body.rating)
    });
    res.redirect('/admin?toast=Reseña actualizada&type=success#resenas');
  } catch (error) {
    next(error);
  }
});

router.post('/reviews/:id/delete', requireAuth, async (req, res, next) => {
  try {
    await db.deleteReview(req.params.id);
    res.redirect('/admin?toast=Reseña eliminada&type=success#resenas');
  } catch (error) {
    next(error);
  }
});

router.post('/pricing', requireAuth, async (req, res, next) => {
  try {
    await db.createPricing({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      sort_order: Number(req.body.sort_order || 0)
    });
    res.redirect('/admin?toast=Servicio/presupuesto agregado&type=success#precios');
  } catch (error) {
    next(error);
  }
});

router.post('/pricing/:id/update', requireAuth, async (req, res, next) => {
  try {
    await db.updatePricing(req.params.id, {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      sort_order: Number(req.body.sort_order || 0)
    });
    res.redirect('/admin?toast=Elemento actualizado&type=success#precios');
  } catch (error) {
    next(error);
  }
});

router.post('/pricing/:id/delete', requireAuth, async (req, res, next) => {
  try {
    await db.deletePricing(req.params.id);
    res.redirect('/admin?toast=Elemento eliminado&type=success#precios');
  } catch (error) {
    next(error);
  }
});

module.exports = router;