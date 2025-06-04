const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const isModerator = require("../middleware/isModerator");
// Функция для безопасного преобразования строки с запятыми в массив
function parseToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(",").map(s => s.trim()).filter(Boolean);
}

// POST /api/applications — создать заявку (для car или part)
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const {
    // Общие поля
    type,
    description,

    // Для автомобиля
    country_car,
    brand_car,
    price_from_car,
    price_to_car,
    year_from_car,
    year_to_car,
    year_range_car,
    mileage_from_car,
    mileage_to_car,
    gearbox_car,
    body_car,
    drive_car,
    car_power,

    // Для запчасти
    country_part,
    brand_part,
    model_part,
    part_name,
    price_from_part,
    price_to_part,
    body_part
  } = req.body;

  if (!type || (type !== "car" && type !== "part")) {
    return res.status(400).json({ error: "Неверный или отсутствующий тип заявки" });
  }

  try {
    await db.query("BEGIN");

    // Вставка основной заявки
    const insertAppQuery = `
      INSERT INTO applications (user_id, type, description, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const result = await db.query(insertAppQuery, [userId, type, description || null, "в обработке"]);
    const applicationId = result.rows[0].id;

    if (type === "car") {
      // Заявка на автомобиль
      const countryCarArr = parseToArray(country_car);
      const brandCarArr = parseToArray(brand_car);
      const gearboxCarArr = parseToArray(gearbox_car);
      const bodyCarArr = parseToArray(body_car);
      const driveCarArr = parseToArray(drive_car);

      const insertCarQuery = `
        INSERT INTO car_applications (
          application_id,
          country_car,
          brand_car,
          price_from_car,
          price_to_car,
          year_from_car,
          year_to_car,
          year_range_car,
          mileage_from_car,
          mileage_to_car,
          gearbox_car,
          body_car,
          drive_car,
          car_power
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
      `;

      await db.query(insertCarQuery, [
        applicationId,
        countryCarArr.length ? countryCarArr : null,
        brandCarArr.length ? brandCarArr : null,
        price_from_car || null,
        price_to_car || null,
        year_from_car || null,
        year_to_car || null,
        year_range_car || null,
        mileage_from_car || null,
        mileage_to_car || null,
        gearboxCarArr.length ? gearboxCarArr : null,
        bodyCarArr.length ? bodyCarArr : null,
        driveCarArr.length ? driveCarArr : null,
        car_power || null
      ]);

    } else if (type === "part") {
      // Заявка на запчасть
      const insertPartQuery = `
        INSERT INTO part_applications (
          application_id,
          country_part,
          brand_part,
          model_part,
          part_name,
          price_from_part,
          price_to_part,
          body_part,
          description
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
      `;

      await db.query(insertPartQuery, [
        applicationId,
        country_part || null,
        brand_part || null,
        model_part || null,
        part_name || null,
        price_from_part || null,
        price_to_part || null,
        body_part || null,
        description || null
      ]);
    }

    await db.query("COMMIT");

    res.status(201).json({ message: "Заявка успешно создана", applicationId });

  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Ошибка при создании заявки:", error);
    res.status(500).json({ error: "Ошибка сервера при создании заявки" });
  }
});

// GET /api/applications — получить все заявки текущего пользователя
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.userId;
  try {
    const query = `
      SELECT a.id, a.type, a.description, a.status, a.date,
        c.country_car, c.brand_car, c.price_from_car, c.price_to_car, c.year_from_car, c.year_to_car,
        c.year_range_car, c.mileage_from_car, c.mileage_to_car, c.gearbox_car, c.body_car, c.drive_car, c.car_power,
        p.country_part, p.brand_part, p.model_part, p.part_name, p.price_from_part, p.price_to_part, p.body_part
      FROM applications a
      LEFT JOIN car_applications c ON a.id = c.application_id
      LEFT JOIN part_applications p ON a.id = p.application_id
      WHERE a.user_id = $1
      ORDER BY a.date DESC
    `;
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка при получении заявок:", error);
    res.status(500).json({ error: "Ошибка сервера при получении заявок" });
  }
});
// GET /api/applications/all — получить все заявки (только для модератора)
router.get("/all", authMiddleware, isModerator, async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.user_id,
        a.type,
        a.status,
        a.date,
        u.first_name,
        u.last_name,
        u.email
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.status = 'в обработке'
      ORDER BY a.date DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка получения всех заявок:", error);
    res.status(500).json({ error: "Ошибка сервера при получении заявок" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const userRole = req.userRole;  // теперь есть роль
  const applicationId = parseInt(req.params.id, 10);

  if (isNaN(applicationId)) {
    return res.status(400).json({ error: "Неверный идентификатор заявки" });
  }

  try {
    let query;
    let params;

    if (userRole === "moderator") {
      // Модератор видит любую заявку
      query = `
        SELECT a.id, a.user_id, a.type, a.description, a.status, a.date,
          c.application_id, c.country_car, c.brand_car, c.price_from_car, c.price_to_car, c.year_from_car, c.year_to_car,
          c.year_range_car, c.mileage_from_car, c.mileage_to_car, c.gearbox_car, c.body_car, c.drive_car, c.car_power,
          p.country_part, p.brand_part, p.model_part, p.part_name, p.price_from_part, p.price_to_part, p.body_part
        FROM applications a
        LEFT JOIN car_applications c ON a.id = c.application_id
        LEFT JOIN part_applications p ON a.id = p.application_id
        WHERE a.id = $1
        LIMIT 1
      `;
      params = [applicationId];
    } else {
      // Обычный пользователь — только свои заявки
      query = `
        SELECT a.id, a.user_id, a.type, a.description, a.status, a.date,
          c.application_id, c.country_car, c.brand_car, c.price_from_car, c.price_to_car, c.year_from_car, c.year_to_car,
          c.year_range_car, c.mileage_from_car, c.mileage_to_car, c.gearbox_car, c.body_car, c.drive_car, c.car_power,
          p.country_part, p.brand_part, p.model_part, p.part_name, p.price_from_part, p.price_to_part, p.body_part
        FROM applications a
        LEFT JOIN car_applications c ON a.id = c.application_id
        LEFT JOIN part_applications p ON a.id = p.application_id
        WHERE a.user_id = $1 AND a.id = $2
        LIMIT 1
      `;
      params = [userId, applicationId];
    }

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Ошибка при получении заявки:", error);
    res.status(500).json({ error: "Ошибка сервера при получении заявки" });
  }
});


// DELETE /api/applications/:id — отменить заявку
router.delete("/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const applicationId = req.params.id;
  try {
    const checkQuery = `SELECT user_id FROM applications WHERE id = $1`;
    const checkResult = await db.query(checkQuery, [applicationId]);
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Нет доступа к этой заявке" });
    }

    const deleteQuery = `UPDATE applications SET status = 'отменено' WHERE id = $1`;
    await db.query(deleteQuery, [applicationId]);

    res.json({ message: `Заявка №${applicationId} отменена` });
  } catch (error) {
    console.error("Ошибка при отмене заявки:", error);
    res.status(500).json({ error: "Ошибка сервера при отмене заявки" });
  }
});

// PATCH /api/applications/:id/close — закрыть заявку
router.patch("/:id/close", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const applicationId = parseInt(req.params.id, 10);
  if (isNaN(applicationId)) {
    return res.status(400).json({ error: "Неверный идентификатор заявки" });
  }

  try {
    const checkQuery = "SELECT status FROM applications WHERE id = $1 AND user_id = $2";
    const checkResult = await db.query(checkQuery, [applicationId, userId]);
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    const currentStatus = checkResult.rows[0].status;
    if (currentStatus === "выполнена") {
      return res.status(400).json({ error: "Заявка уже закрыта" });
    }
    if (currentStatus === "отменена") {
      return res.status(400).json({ error: "Нельзя закрыть отмененную заявку" });
    }

    const updateQuery = "UPDATE applications SET status = 'выполнена' WHERE id = $1";
    await db.query(updateQuery, [applicationId]);

    res.json({ message: "Заявка успешно закрыта" });
  } catch (error) {
    console.error("Ошибка при закрытии заявки:", error);
    res.status(500).json({ error: "Ошибка сервера при закрытии заявки" });
  }
});

module.exports = router;