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
router.post("/request-email-change", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const currentUser = await getUserById(userId);
    if (!currentUser) return res.status(404).json({ error: "Пользователь не найден" });
    console.log("Отправляем код:", code);
    console.log("На email:", currentUser.email);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 минут

    // Удаляем старые коды
    await db.query("DELETE FROM password_resets WHERE email = $1", [currentUser.email]);

    // Сохраняем новый код
    await db.query(`
      INSERT INTO password_resets (email, code, expires_at)
      VALUES ($1, $2, to_timestamp($3 / 1000.0))
    `, [currentUser.email, code, expires]);

    // Настройка SMTP Яндекс
    const transporter = nodemailer.createTransport({
      host: "smtp.yandex.ru",
      port: 465,
      secure: true,
      auth: {
        user: process.env.YANDEX_EMAIL,
        pass: process.env.YANDEX_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Отправка письма
    await transporter.sendMail({
      from: `"DragonAuto" <${process.env.YANDEX_EMAIL}>`,
      to: currentUser.email,
      subject: "Код изменения email",
      text: `Ваш код для изменения email: ${code}. Он действителен в течение 10 минут.`,
    });

    console.log(`Код изменения email ${code} отправлен на ${currentUser.email}`);
    res.json({ message: "Код изменения email отправлен на вашу почту" });

  } catch (error) {
    console.error("Ошибка отправки кода изменения email:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обновление email с использованием кода
router.put("/email", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { email, code } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email обязателен и должен быть строкой" });
    }
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Код обязателен и должен быть строкой" });
    }

    email = email.trim();
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Неверный формат email" });
    }

    const currentUser = await getUserById(userId);
    if (!currentUser) return res.status(404).json({ error: "Пользователь не найден" });

    // Проверяем код
    const result = await db.query(
      "SELECT * FROM password_resets WHERE email = $1 AND code = $2 ORDER BY created_at DESC LIMIT 1",
      [currentUser.email, code]
    );

    const entry = result.rows[0];

    if (!entry) {
      return res.status(400).json({ error: "Неверный код" });
    }

    if (new Date(entry.expires_at) < new Date()) {
      return res.status(400).json({ error: "Срок действия кода истёк" });
    }

    // Проверяем, занят ли новый email
    const emailCheck = await db.query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [email, userId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Данный email уже используется" });
    }

    // Обновляем email
    await db.query(`UPDATE users SET email = $1 WHERE id = $2`, [email, userId]);

    // Опционально: удаляем использованный код
    await db.query("DELETE FROM password_resets WHERE email = $1", [currentUser.email]);

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