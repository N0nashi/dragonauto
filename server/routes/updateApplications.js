const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// Функция для безопасного преобразования строки с запятыми в массив
function parseToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(",").map(s => s.trim()).filter(Boolean);
}

// PUT /api/applications/:id — обновление заявки с отдельной логикой
router.put("/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const applicationId = req.params.id;

  // Извлечение полей из тела запроса
  const {
    description,
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
    power_from_car,         
    power_to_car,           
    body_part,
    country_part,
    brand_part,
    model_part,
    part_name,
    price_from_part,
    price_to_part,
  } = req.body;

  try {
    // Проверяем, что заявка существует и принадлежит пользователю
    const checkQuery = `SELECT user_id, type FROM applications WHERE id = $1`;
    const checkResult = await db.query(checkQuery, [applicationId]);

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Нет доступа к этой заявке" });
    }

    const type = checkResult.rows[0].type;

    await db.query("BEGIN");

    // Обновляем описание (или другие поля) в таблице applications
    const updateAppQuery = `
      UPDATE applications
      SET description = $1
      WHERE id = $2
    `;
    await db.query(updateAppQuery, [description, applicationId]);

    if (type === "car") {
      const countryCarArr = parseToArray(country_car);
      const brandCarArr = parseToArray(brand_car);
      const gearboxCarArr = parseToArray(gearbox_car);
      const bodyCarArr = parseToArray(body_car);
      const driveCarArr = parseToArray(drive_car); 

      const updateCarQuery = `
        UPDATE car_applications SET
          country_car = $1,
          brand_car = $2,
          price_from_car = $3,
          price_to_car = $4,
          year_from_car = $5,
          year_to_car = $6,
          year_range_car = $7,
          mileage_from_car = $8,
          mileage_to_car = $9,
          gearbox_car = $10,
          body_car = $11,
          drive_car = $12,
          power_from_car = $13,
          power_to_car = $14
        WHERE application_id = $15
      `;

      await db.query(updateCarQuery, [
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
        power_from_car || null,                  
        power_to_car || null,                    
        applicationId,
      ]);
    } else if (type === "part") {
      const updatePartQuery = `
        UPDATE part_applications SET
          country_part = $1,
          brand_part = $2,
          model_part = $3,
          part_name = $4,
          price_from_part = $5,
          price_to_part = $6,
          body_part = $7,
          description = $8
        WHERE application_id = $9
      `;

      await db.query(updatePartQuery, [
        country_part || null,
        brand_part || null,
        model_part || null,
        part_name || null,
        price_from_part || null,
        price_to_part || null,
        body_part || null,
        description || null,
        applicationId,
      ]);
    }

    await db.query("COMMIT");

    res.json({ message: `Заявка №${applicationId} обновлена` });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Ошибка при обновлении заявки:", error);
    res.status(500).json({ error: "Ошибка сервера при обновлении заявки" });
  }
});

module.exports = router;