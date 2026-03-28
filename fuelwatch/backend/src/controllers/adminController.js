const db = require('../config/database');

function getDashboard(req, res) {
  const totalStations = db.prepare("SELECT COUNT(*) AS count FROM stations WHERE is_active = 1").get().count;
  const totalUsers = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'user' AND is_active = 1").get().count;
  const pendingSubmissions = db.prepare("SELECT COUNT(*) AS count FROM price_submissions WHERE status = 'pending'").get().count;
  const totalSubmissions = db.prepare("SELECT COUNT(*) AS count FROM price_submissions").get().count;
  const approvedSubmissions = db.prepare("SELECT COUNT(*) AS count FROM price_submissions WHERE status = 'approved'").get().count;
  const rejectedSubmissions = db.prepare("SELECT COUNT(*) AS count FROM price_submissions WHERE status = 'rejected'").get().count;
  const openReports = db.prepare("SELECT COUNT(*) AS count FROM reports WHERE status = 'open'").get().count;

  // Recent 5 pending submissions
  const recentPending = db.prepare(`
    SELECT ps.id, ps.submitted_price, ps.created_at, s.name AS station_name, fp.name AS product_name, u.name AS submitter_name
    FROM price_submissions ps
    JOIN stations s ON ps.station_id = s.id
    JOIN fuel_products fp ON ps.fuel_product_id = fp.id
    LEFT JOIN users u ON ps.submitted_by = u.id
    WHERE ps.status = 'pending'
    ORDER BY ps.created_at ASC
    LIMIT 5
  `).all();

  return res.json({
    stats: {
      total_stations: totalStations,
      total_users: totalUsers,
      pending_submissions: pendingSubmissions,
      total_submissions: totalSubmissions,
      approved_submissions: approvedSubmissions,
      rejected_submissions: rejectedSubmissions,
      open_reports: openReports,
    },
    recent_pending: recentPending,
  });
}

function getUsers(req, res) {
  const users = db.prepare(
    "SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC"
  ).all();
  return res.json({ users });
}

function updateUser(req, res) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const { is_active, role } = req.body;

  db.prepare(`
    UPDATE users SET
      is_active = COALESCE(?, is_active),
      role = COALESCE(?, role),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(is_active ?? null, role ?? null, req.params.id);

  const updated = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(req.params.id);
  return res.json({ user: updated });
}

module.exports = { getDashboard, getUsers, updateUser };
