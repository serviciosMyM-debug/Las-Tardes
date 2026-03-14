function requireAuth(req, res, next) {
  if (!req.session.admin) {
    return res.redirect('/admin/login?toast=Debes iniciar sesión&type=error');
  }
  next();
}

module.exports = { requireAuth };
