const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function mapAvailabilityRow(row) {
  return {
    weekday: row.weekday,
    enabled: row.enabled,
    slots: row.slots
      ? row.slots.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  };
}

module.exports = {
  async authenticateAdmin(username, password) {
    const { rows } = await pool.query(
      'SELECT * FROM admins WHERE username = $1 LIMIT 1',
      [username]
    );
    const admin = rows[0];
    if (!admin) return null;
    return bcrypt.compareSync(password || '', admin.password_hash) ? admin : null;
  },

  async getBusinessSettings() {
    const { rows } = await pool.query(
      'SELECT * FROM business_settings WHERE id = 1 LIMIT 1'
    );
    return rows[0];
  },

  async updateBusinessSettings(payload) {
    await pool.query(
      `UPDATE business_settings
       SET business_name = $1,
           phone = $2,
           address = $3,
           hours = $4,
           hero_title = $5,
           hero_subtitle = $6,
           about_text = $7,
           importance_text = $8
       WHERE id = 1`,
      [
        payload.business_name,
        payload.phone,
        payload.address,
        payload.hours,
        payload.hero_title,
        payload.hero_subtitle,
        payload.about_text,
        payload.importance_text
      ]
    );
  },

  async listServices() {
    const { rows } = await pool.query('SELECT * FROM services ORDER BY id ASC');
    return rows;
  },

  async listPricing() {
    const { rows } = await pool.query(
      'SELECT * FROM pricing ORDER BY sort_order ASC, id ASC'
    );
    return rows;
  },

  async createPricing(payload) {
    const { rows } = await pool.query(
      `INSERT INTO pricing (name, description, price, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payload.name, payload.description, payload.price, payload.sort_order]
    );
    return rows[0];
  },

  async updatePricing(id, payload) {
    await pool.query(
      `UPDATE pricing
       SET name = $1, description = $2, price = $3, sort_order = $4
       WHERE id = $5`,
      [payload.name, payload.description, payload.price, payload.sort_order, Number(id)]
    );
  },

  async deletePricing(id) {
    await pool.query('DELETE FROM pricing WHERE id = $1', [Number(id)]);
  },

  async listReviews() {
    const { rows } = await pool.query('SELECT * FROM reviews ORDER BY id DESC');
    return rows;
  },

  async createReview(payload) {
    const { rows } = await pool.query(
      `INSERT INTO reviews (client_name, comment, rating)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [payload.client_name, payload.comment, payload.rating]
    );
    return rows[0];
  },

  async updateReview(id, payload) {
    await pool.query(
      `UPDATE reviews
       SET client_name = $1, comment = $2, rating = $3
       WHERE id = $4`,
      [payload.client_name, payload.comment, payload.rating, Number(id)]
    );
  },

  async deleteReview(id) {
    await pool.query('DELETE FROM reviews WHERE id = $1', [Number(id)]);
  },

  async listAvailability() {
    const { rows } = await pool.query(
      'SELECT * FROM availability ORDER BY weekday ASC'
    );
    return rows.map(mapAvailabilityRow);
  },

  async getAvailabilityByWeekday(weekday) {
    const { rows } = await pool.query(
      'SELECT * FROM availability WHERE weekday = $1 LIMIT 1',
      [Number(weekday)]
    );
    return rows[0] ? mapAvailabilityRow(rows[0]) : null;
  },

  async updateAvailability(days) {
    for (const day of days) {
      await pool.query(
        `UPDATE availability
         SET enabled = $1, slots = $2
         WHERE weekday = $3`,
        [day.enabled, day.slots.join(','), day.weekday]
      );
    }
  },

  async listBlockedDates() {
    const { rows } = await pool.query(
      'SELECT id, TO_CHAR(date, \'YYYY-MM-DD\') AS date, reason FROM blocked_dates ORDER BY date ASC'
    );
    return rows;
  },

  async addBlockedDate(payload) {
    const { rows } = await pool.query(
      `INSERT INTO blocked_dates (date, reason)
       VALUES ($1, $2)
       RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') AS date, reason`,
      [payload.date, payload.reason || '']
    );
    return rows[0];
  },

  async deleteBlockedDate(id) {
    await pool.query('DELETE FROM blocked_dates WHERE id = $1', [Number(id)]);
  },

  async findBlockedDate(date) {
    const { rows } = await pool.query(
      `SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, reason
       FROM blocked_dates
       WHERE date = $1
       LIMIT 1`,
      [date]
    );
    return rows[0] || null;
  },

  async listAppointments() {
    const { rows } = await pool.query(
      `SELECT id, name, phone,
              TO_CHAR(date, 'YYYY-MM-DD') AS date,
              time, notes, status, created_at
       FROM appointments
       ORDER BY date ASC, time ASC`
    );
    return rows;
  },

  async getUpcomingAppointments(limit = 5) {
    const today = dayjs().format('YYYY-MM-DD');
    const { rows } = await pool.query(
      `SELECT id, name, phone,
              TO_CHAR(date, 'YYYY-MM-DD') AS date,
              time, notes, status, created_at
       FROM appointments
       WHERE date >= $1 AND status <> 'cancelado'
       ORDER BY date ASC, time ASC
       LIMIT $2`,
      [today, limit]
    );
    return rows;
  },

  async getTakenSlots(date) {
    const { rows } = await pool.query(
      `SELECT time
       FROM appointments
       WHERE date = $1 AND status <> 'cancelado'`,
      [date]
    );
    return rows.map((r) => r.time);
  },

  async createAppointment(payload) {
    const { rows } = await pool.query(
      `INSERT INTO appointments (name, phone, date, time, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'pendiente')
       RETURNING id, name, phone, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, notes, status, created_at`,
      [payload.name, payload.phone, payload.date, payload.time, payload.notes]
    );
    return rows[0];
  },

  async updateAppointmentStatus(id, status) {
    await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2',
      [status, Number(id)]
    );
  },

  async deleteAppointment(id) {
    await pool.query('DELETE FROM appointments WHERE id = $1', [Number(id)]);
  },

  async getSummary() {
    const totalAppointments = await pool.query('SELECT COUNT(*)::int AS count FROM appointments');
    const totalReviews = await pool.query('SELECT COUNT(*)::int AS count FROM reviews');
    const totalPricing = await pool.query('SELECT COUNT(*)::int AS count FROM pricing');
    const pendingAppointments = await pool.query(
      `SELECT COUNT(*)::int AS count FROM appointments WHERE status = 'pendiente'`
    );
    const occupiedSlots = await pool.query(
      `SELECT COUNT(*)::int AS count FROM appointments WHERE status <> 'cancelado'`
    );

    return {
      totalAppointments: totalAppointments.rows[0].count,
      totalReviews: totalReviews.rows[0].count,
      totalPricing: totalPricing.rows[0].count,
      pendingAppointments: pendingAppointments.rows[0].count,
      occupiedSlots: occupiedSlots.rows[0].count
    };
  }
};