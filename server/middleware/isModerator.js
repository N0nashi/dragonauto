const db = require("../db");

module.exports = async function (req, res, next) {
  try {
    const result = await db.query(`SELECT role FROM users WHERE id = $1`, [req.userId]);
    const user = result.rows[0];

    if (!user || user.role !== "moderator") {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    next();
  } catch (err) {
    console.error("Ошибка проверки роли:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

