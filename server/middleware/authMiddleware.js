const jwt = require("jsonwebtoken");
const db = require("../db"); // Добавляем доступ к БД
const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Токен не предоставлен" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен отсутствует" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;

    // Получаем роль пользователя из БД и сохраняем в req.userRole
    const result = await db.query(`SELECT role FROM users WHERE id = $1`, [req.userId]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Пользователь не найден" });
    req.userRole = user.role;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Неверный токен" });
  }
}

module.exports = authMiddleware;
