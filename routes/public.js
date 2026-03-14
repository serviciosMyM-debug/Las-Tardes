const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [settings, services, pricing, reviews] = await Promise.all([
      db.getBusinessSettings(),
      db.listServices(),
      db.listPricing(),
      db.listReviews()
    ]);

    res.render('index', {
      settings,
      services,
      pricing,
      reviews,
      toast: req.query.toast || '',
      toastType: req.query.type || 'success'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;