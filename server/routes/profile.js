const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

// Вспомогательная функция проверки email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Хелпер для получения пользователя по id
async function getUserById(userId) {
  const result = await db.query(
    `SELECT id, email, first_name, last_name, role, photo_url, created_at FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0];
}

// Получить данные профиля (текущий или любой пользователь)
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Если есть заголовок X-User-ID → получаем данные другого пользователя
    const requestedUserId = req.headers["x-user-id"]
      ? parseInt(req.headers["x-user-id"], 10)
      : req.userId;

    // Проверяем, является ли запрашивающий модератором
    if (requestedUserId !== req.userId && req.user?.role !== "moderator") {
      return res.status(403).json({ error: "Нет прав на просмотр других пользователей" });
    }

    const user = await getUserById(requestedUserId);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json(user);
  } catch (error) {
    console.error("Ошибка при получении профиля:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обновление профиля (имя, фамилия, photo_url)
router.put("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    let { first_name, last_name, photo_url } = req.body;

    if (first_name !== undefined && typeof first_name !== "string") {
      return res.status(400).json({ error: "first_name должен быть строкой" });
    }
    if (last_name !== undefined && typeof last_name !== "string") {
      return res.status(400).json({ error: "last_name должен быть строкой" });
    }
    if (photo_url !== undefined && typeof photo_url !== "string") {
      return res.status(400).json({ error: "photo_url должен быть строкой" });
    }

    const currentUser = await getUserById(userId);
    if (!currentUser) return res.status(404).json({ error: "Пользователь не найден" });

    const updatedFirstName = first_name !== undefined ? first_name : currentUser.first_name;
    const updatedLastName = last_name !== undefined ? last_name : currentUser.last_name;
    const updatedPhotoUrl = photo_url !== undefined ? photo_url : currentUser.photo_url;

    await db.query(
      `UPDATE users SET first_name = $1, last_name = $2, photo_url = $3 WHERE id = $4`,
      [updatedFirstName, updatedLastName, updatedPhotoUrl, userId]
    );

    const updatedUser = await getUserById(userId);
    res.json({ message: "Профиль успешно обновлён", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обновление photo_url после загрузки аватара (принимает url из /upload/avatars)
router.put("/avatar", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { photo_url } = req.body;

    if (!photo_url || typeof photo_url !== "string") {
      return res.status(400).json({ error: "photo_url обязателен и должен быть строкой" });
    }

    await db.query(`UPDATE users SET photo_url = $1 WHERE id = $2`, [photo_url, userId]);

    const updatedUser = await getUserById(userId);
    res.json({ message: "Аватар успешно обновлён", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обновление email
router.put("/email", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    let { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email обязателен и должен быть строкой" });
    }

    email = email.trim();
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Неверный формат email" });
    }

    const emailCheck = await db.query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [email, userId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Данный email уже используется" });
    }

    await db.query(`UPDATE users SET email = $1 WHERE id = $2`, [email, userId]);

    const updatedUser = await getUserById(userId);
    res.json({ message: "Email успешно обновлён", user: updatedUser });
  } catch (error) {
    console.error("PUT /profile/email error:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обновление пароля
router.put("/password", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Текущий и новый пароли обязательны" });
    }

    const userResult = await db.query(`SELECT password FROM users WHERE id = $1`, [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const hashedPassword = userResult.rows[0].password;
    const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Текущий пароль неверен" });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(`UPDATE users SET password = $1 WHERE id = $2`, [newHashedPassword, userId]);

    res.json({ message: "Пароль успешно обновлён" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
