const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

/* GET /api/notifications — list of recent notifications with app info */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT n.id, n.application_id, n.type, n.is_read, n.created_at,
              a.status AS app_status, a.type AS app_type
       FROM application_notifications n
       JOIN applications a ON a.id = n.application_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [req.userId]
    );
    res.json(r.rows);
  } catch (err) {
    console.error("notifications list error:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/* GET /api/notifications/unread-count */
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const r = await db.query(
      "SELECT COUNT(*)::int AS count FROM application_notifications WHERE user_id = $1 AND is_read = FALSE",
      [req.userId]
    );
    res.json({ count: r.rows[0].count });
  } catch (err) {
    console.error("unread-count error:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/* GET /api/notifications/per-application — unread counts grouped by app */
router.get("/per-application", authMiddleware, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT application_id, COUNT(*)::int AS count
       FROM application_notifications
       WHERE user_id = $1 AND is_read = FALSE
       GROUP BY application_id`,
      [req.userId]
    );
    const map = {};
    r.rows.forEach(row => { map[row.application_id] = row.count; });
    res.json(map);
  } catch (err) {
    console.error("per-application error:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/* PATCH /api/notifications/mark-read — mark notifications read */
router.patch("/mark-read", authMiddleware, async (req, res) => {
  const { application_id } = req.body;
  try {
    if (application_id) {
      await db.query(
        "UPDATE application_notifications SET is_read = TRUE WHERE user_id = $1 AND application_id = $2",
        [req.userId, application_id]
      );
    } else {
      await db.query(
        "UPDATE application_notifications SET is_read = TRUE WHERE user_id = $1",
        [req.userId]
      );
    }
    res.json({ message: "Отмечено как прочитанное" });
  } catch (err) {
    console.error("mark-read error:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
