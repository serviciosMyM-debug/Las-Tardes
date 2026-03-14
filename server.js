require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
require('./db');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'las-tardes-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`Las Tardes corriendo en http://localhost:${PORT}`);
});
