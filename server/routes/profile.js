const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

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

    // Имя и фамилия обязательны
    if (!first_name || typeof first_name !== "string") {
      return res.status(400).json({ error: "first_name обязателен и должен быть строкой" });
    }
    if (!last_name || typeof last_name !== "string") {
      return res.status(400).json({ error: "last_name обязателен и должен быть строкой" });
    }
    if (photo_url !== undefined && typeof photo_url !== "string") {
      return res.status(400).json({ error: "photo_url должен быть строкой" });
    }

    const currentUser = await getUserById(userId);
    if (!currentUser) return res.status(404).json({ error: "Пользователь не найден" });

    const updatedPhotoUrl = photo_url !== undefined ? photo_url : currentUser.photo_url;

    await db.query(
      `UPDATE users SET first_name = $1, last_name = $2, photo_url = $3 WHERE id = $4`,
      [first_name.trim(), last_name.trim(), updatedPhotoUrl, userId]
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

// Отправка кода для изменения email
router.put("/request-email-change", authMiddleware, async (req, res) => {
res.json({ message: 'Test route works!' });
});
// Обновление email с использованием кода
router.put("/email", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    let { newEmail, code } = req.body;

    // Валидация
    if (!newEmail || typeof newEmail !== "string") {
      return res.status(400).json({ error: "Новый email обязателен" });
    }
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Код подтверждения обязателен" });
    }

    newEmail = newEmail.trim().toLowerCase();
    if (!isValidEmail(newEmail)) {
      return res.status(400).json({ error: "Неверный формат email" });
    }

    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    // Проверяем код
    const result = await db.query(
      `SELECT * FROM password_resets 
       WHERE email = $1 AND code = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [currentUser.email, code]
    );

    const resetEntry = result.rows[0];
    if (!resetEntry) {
      return res.status(400).json({ error: "Неверный код подтверждения" });
    }

    if (new Date(resetEntry.expires_at) < new Date()) {
      return res.status(400).json({ error: "Срок действия кода истёк" });
    }

    // Проверяем, не занят ли новый email
    const emailCheck = await db.query(
      `SELECT id FROM users WHERE email = $1`,
      [newEmail]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Этот email уже используется" });
    }

    // Обновляем email
    await db.query(
      `UPDATE users SET email = $1 WHERE id = $2`,
      [newEmail, userId]
    );

    // Удаляем использованный код
    await db.query(
      `DELETE FROM password_resets WHERE email = $1`,
      [currentUser.email]
    );

    const updatedUser = await getUserById(userId);
    res.json({ 
      message: "Email успешно изменён",
      user: updatedUser 
    });

  } catch (error) {
    console.error("Ошибка при обновлении email:", error);
    res.status(500).json({ 
      error: "Ошибка при обновлении email",
      details: error.message 
    });
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