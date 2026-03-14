const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    settings: db.getBusinessSettings(),
    services: db.listServices(),
    pricing: db.listPricing(),
    reviews: db.listReviews(),
    toast: req.query.toast || '',
    toastType: req.query.type || 'success'
  });
});

module.exports = router;
