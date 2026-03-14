const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

const dbPath = path.join(__dirname, 'data', 'db.json');

const initialData = {
  counters: {
    admin: 1,
    service: 6,
    pricing: 5,
    review: 3,
    blockedDate: 0,
    appointment: 0
  },
  admins: [
    {
      id: 1,
      username: 'admin',
      password_hash: bcrypt.hashSync('admin123', 10),
      created_at: new Date().toISOString()
    }
  ],
  businessSettings: {
    business_name: 'Las Tardes',
    phone: '3413538035',
    address: 'Las Tardes Norte 2524 - Roldán',
    hours: 'Lunes a Viernes de 09:00 a 18:00 · Sábados de 09:00 a 13:00',
    hero_title: 'Tapicería artesanal con terminaciones premium',
    hero_subtitle: 'Restauramos, renovamos y realzamos muebles con criterio estético, materiales de calidad y atención personalizada.',
    about_text: 'En Las Tardes trabajamos cada pieza como un proyecto único. Combinamos oficio, detalle y asesoramiento para transformar sillones, sillas, respaldos y muebles en piezas renovadas, cómodas y duraderas.',
    importance_text: 'Una buena tapicería no solo mejora la estética: prolonga la vida útil del mueble, suma confort, valoriza los ambientes y permite personalizar cada espacio según el estilo y la necesidad del cliente. Invertir en restauración y retapizado es elegir calidad, identidad y durabilidad.'
  },
  services: [
    { id: 1, title: 'Tapizado de sillones', description: 'Renovación integral de sillones individuales, dobles y de gran porte.', icon: '🛋️' },
    { id: 2, title: 'Restauración de muebles', description: 'Recuperación estética y funcional de piezas con valor sentimental o decorativo.', icon: '🪑' },
    { id: 3, title: 'Retapizado de sillas', description: 'Cambio de telas, espuma y terminaciones para uso doméstico o comercial.', icon: '✨' },
    { id: 4, title: 'Cabeceras personalizadas', description: 'Diseños sobrios, modernos o clásicos para dormitorios con presencia.', icon: '🛏️' },
    { id: 5, title: 'Cambio de espumas y costuras', description: 'Mejora del confort, firmeza y terminación de cada trabajo.', icon: '🧵' },
    { id: 6, title: 'Trabajos a medida', description: 'Soluciones personalizadas según estilo, necesidad, tela y presupuesto.', icon: '📐' }
  ],
  pricing: [
    { id: 1, name: 'Tapizado de silla', description: 'Asiento y respaldo estándar con terminación prolija.', price: '$45.000', sort_order: 1 },
    { id: 2, name: 'Restauración de sillón individual', description: 'Estructura, tapizado y detalles generales.', price: '$180.000', sort_order: 2 },
    { id: 3, name: 'Cambio de espuma', description: 'Recambio según densidad y tamaño de la pieza.', price: '$28.000', sort_order: 3 },
    { id: 4, name: 'Tapizado de respaldo / cabecera', description: 'Trabajo a medida con variedad de telas.', price: '$95.000', sort_order: 4 },
    { id: 5, name: 'Trabajo personalizado', description: 'Cotización según complejidad, materiales y dimensiones.', price: 'A consultar', sort_order: 5 }
  ],
  reviews: [
    { id: 1, client_name: 'María G.', comment: 'Excelente terminación y muy buena atención. Mi sillón quedó como nuevo.', rating: 5 },
    { id: 2, client_name: 'Lucas R.', comment: 'Cumplieron con el tiempo acordado y el trabajo quedó impecable.', rating: 5 },
    { id: 3, client_name: 'Ana P.', comment: 'Me asesoraron con la tela y el resultado fue mejor de lo que esperaba.', rating: 4 }
  ],
  availability: [
    { weekday: 0, enabled: false, slots: [] },
    { weekday: 1, enabled: true, slots: ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'] },
    { weekday: 2, enabled: true, slots: ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'] },
    { weekday: 3, enabled: true, slots: ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'] },
    { weekday: 4, enabled: true, slots: ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'] },
    { weekday: 5, enabled: true, slots: ['09:00', '10:00', '11:00', '15:00', '16:00'] },
    { weekday: 6, enabled: true, slots: ['09:00', '10:00', '11:00', '12:00'] }
  ],
  blockedDates: [],
  appointments: []
};

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(data, key) {
  data.counters[key] = (data.counters[key] || 0) + 1;
  return data.counters[key];
}

function sortBy(list, keys) {
  return [...list].sort((a, b) => {
    for (const key of keys) {
      const [field, dir] = key;
      if (a[field] < b[field]) return dir === 'desc' ? 1 : -1;
      if (a[field] > b[field]) return dir === 'desc' ? -1 : 1;
    }
    return 0;
  });
}

module.exports = {
  authenticateAdmin(username, password) {
    const data = readDb();
    const admin = data.admins.find((item) => item.username === username);
    if (!admin) return null;
    return bcrypt.compareSync(password || '', admin.password_hash) ? admin : null;
  },

  getBusinessSettings() {
    return readDb().businessSettings;
  },

  updateBusinessSettings(payload) {
    const data = readDb();
    data.businessSettings = { ...data.businessSettings, ...payload };
    writeDb(data);
  },

  listServices() {
    return readDb().services;
  },

  listPricing() {
    return sortBy(readDb().pricing, [['sort_order', 'asc'], ['id', 'asc']]);
  },

  createPricing(payload) {
    const data = readDb();
    const item = { id: nextId(data, 'pricing'), ...payload };
    data.pricing.push(item);
    writeDb(data);
    return item;
  },

  updatePricing(id, payload) {
    const data = readDb();
    data.pricing = data.pricing.map((item) => item.id === Number(id) ? { ...item, ...payload } : item);
    writeDb(data);
  },

  deletePricing(id) {
    const data = readDb();
    data.pricing = data.pricing.filter((item) => item.id !== Number(id));
    writeDb(data);
  },

  listReviews() {
    return sortBy(readDb().reviews, [['id', 'desc']]);
  },

  createReview(payload) {
    const data = readDb();
    const item = { id: nextId(data, 'review'), ...payload };
    data.reviews.push(item);
    writeDb(data);
    return item;
  },

  updateReview(id, payload) {
    const data = readDb();
    data.reviews = data.reviews.map((item) => item.id === Number(id) ? { ...item, ...payload } : item);
    writeDb(data);
  },

  deleteReview(id) {
    const data = readDb();
    data.reviews = data.reviews.filter((item) => item.id !== Number(id));
    writeDb(data);
  },

  listAvailability() {
    return sortBy(readDb().availability, [['weekday', 'asc']]);
  },

  getAvailabilityByWeekday(weekday) {
    return readDb().availability.find((item) => item.weekday === Number(weekday));
  },

  updateAvailability(days) {
    const data = readDb();
    data.availability = data.availability.map((item) => {
      const found = days.find((day) => day.weekday === item.weekday);
      return found ? found : item;
    });
    writeDb(data);
  },

  listBlockedDates() {
    return sortBy(readDb().blockedDates, [['date', 'asc']]);
  },

  addBlockedDate(payload) {
    const data = readDb();
    const exists = data.blockedDates.find((item) => item.date === payload.date);
    if (exists) throw new Error('duplicate');
    const item = { id: nextId(data, 'blockedDate'), ...payload };
    data.blockedDates.push(item);
    writeDb(data);
    return item;
  },

  deleteBlockedDate(id) {
    const data = readDb();
    data.blockedDates = data.blockedDates.filter((item) => item.id !== Number(id));
    writeDb(data);
  },

  findBlockedDate(date) {
    return readDb().blockedDates.find((item) => item.date === date);
  },

  listAppointments() {
    return sortBy(readDb().appointments, [['date', 'asc'], ['time', 'asc']]);
  },

  getUpcomingAppointments(limit = 5) {
    const today = dayjs().format('YYYY-MM-DD');
    return this.listAppointments().filter((item) => item.date >= today && item.status !== 'cancelado').slice(0, limit);
  },

  getTakenSlots(date) {
    return readDb().appointments.filter((item) => item.date === date && item.status !== 'cancelado').map((item) => item.time);
  },

  createAppointment(payload) {
    const data = readDb();
    const item = {
      id: nextId(data, 'appointment'),
      status: 'pendiente',
      created_at: new Date().toISOString(),
      ...payload
    };
    data.appointments.push(item);
    writeDb(data);
    return item;
  },

  updateAppointmentStatus(id, status) {
    const data = readDb();
    data.appointments = data.appointments.map((item) => item.id === Number(id) ? { ...item, status } : item);
    writeDb(data);
  },

  deleteAppointment(id) {
    const data = readDb();
    data.appointments = data.appointments.filter((item) => item.id !== Number(id));
    writeDb(data);
  },

  getSummary() {
    const data = readDb();
    return {
      totalAppointments: data.appointments.length,
      totalReviews: data.reviews.length,
      totalPricing: data.pricing.length,
      pendingAppointments: data.appointments.filter((item) => item.status === 'pendiente').length,
      occupiedSlots: data.appointments.filter((item) => item.status !== 'cancelado').length
    };
  }
};
