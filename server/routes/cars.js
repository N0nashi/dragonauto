const express = require("express");
const router = express.Router();
const db = require("../db");

// Получение фильтров (списки уникальных значений и диапазон цен)
router.get("/filters", async (req, res) => {
  const { country, brand } = req.query;

  try {
    // Запросы с возможностью фильтрации
    const [brandsQuery, modelsQuery, countriesQuery, bodiesQuery, gearboxesQuery, drivesQuery, pricesQuery] = await Promise.all([
      db.query(
        `SELECT DISTINCT brand FROM cars ${country ? "WHERE country = $1" : ""} ORDER BY brand`,
        country ? [country] : []
      ),
      db.query(
        `SELECT DISTINCT model FROM cars ${
          brand ? "WHERE brand = $1" : country ? "WHERE country = $1" : ""
        } ORDER BY model`,
        brand ? [brand] : country ? [country] : []
      ),
      db.query("SELECT DISTINCT country FROM cars ORDER BY country"),
      db.query("SELECT DISTINCT body FROM cars ORDER BY body"),
      db.query("SELECT DISTINCT gearbox FROM cars ORDER BY gearbox"),
      db.query("SELECT DISTINCT drive FROM cars ORDER BY drive"),
      db.query("SELECT MIN(price) as min, MAX(price) as max FROM cars"),
    ]);

    res.json({
      brands: brandsQuery.rows.map(r => r.brand),
      models: modelsQuery.rows.map(r => r.model),
      countries: countriesQuery.rows.map(r => r.country),
      bodies: bodiesQuery.rows.map(r => r.body),
      gearboxes: gearboxesQuery.rows.map(r => r.gearbox),
      drives: drivesQuery.rows.map(r => r.drive),
      priceRange: pricesQuery.rows[0],
    });
  } catch (err) {
    console.error("Ошибка в /api/cars/filters:", err.message);
    res.status(500).json({ error: "Ошибка при получении фильтров" });
  }
});


router.post("/search", async (req, res) => {
  const {
    brand,
    model,
    country,
    year,
    mileage,
    price,
    gearbox,
    drive,
    body,
  } = req.body;

  const filters = [];
  const values = [];

  if (brand) {
    filters.push(`brand = $${values.length + 1}`);
    values.push(brand);
  }
  if (model) {
    filters.push(`model = $${values.length + 1}`);
    values.push(model);
  }
  if (country) {
    filters.push(`country = $${values.length + 1}`);
    values.push(country);
  }
  if (year?.min) {
    filters.push(`year >= $${values.length + 1}`);
    values.push(year.min);
  }
  if (year?.max) {
    filters.push(`year <= $${values.length + 1}`);
    values.push(year.max);
  }
  if (mileage?.min) {
    filters.push(`mileage >= $${values.length + 1}`);
    values.push(mileage.min);
  }
  if (mileage?.max) {
    filters.push(`mileage <= $${values.length + 1}`);
    values.push(mileage.max);
  }
  if (price?.min) {
    filters.push(`price >= $${values.length + 1}`);
    values.push(price.min);
  }
  if (price?.max) {
    filters.push(`price <= $${values.length + 1}`);
    values.push(price.max);
  }
  if (gearbox) {
    filters.push(`gearbox = $${values.length + 1}`);
    values.push(gearbox);
  }
  if (drive) {
    filters.push(`drive = $${values.length + 1}`);
    values.push(drive);
  }
  if (body) {
    filters.push(`body = $${values.length + 1}`);
    values.push(body);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const query = `SELECT * FROM cars ${whereClause} ORDER BY id DESC`;

  try {
    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка в /api/cars/search:", err.message);
    res.status(500).json({ error: "Ошибка при получении автомобилей" });
  }
});


router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT * FROM cars WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Машина не найдена" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка в /api/cars/:id:", err.message);
    res.status(500).json({ error: "Ошибка при получении машины" });
  }
});

router.get("/", async (req, res) => {
  // limit и offset — из query, по умолчанию 10 и 0
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await db.query(
      "SELECT id, country, brand, model, year, engine_power, mileage, gearbox, drive, body, photo_url, price FROM cars ORDER BY id DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка в /api/cars:", err.message);
    res.status(500).json({ error: "Ошибка при получении списка машин" });
  }
});

// POST /api/cars — добавление новой машины
router.post("/", async (req, res) => {
  const {
    country,
    brand,
    model,
    year,
    price,
    drive,
    gearbox,
    body,
    mileage,
    engine_power: power,
    description,
    photo_url,
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO cars (
        country,
        brand,
        model,
        year,
        price,
        drive,
        gearbox,
        body,
        mileage,
        engine_power,
        description,
        photo_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        country,
        brand,
        model,
        year,
        price,
        drive,
        gearbox,
        body,
        mileage,
        power,
        description,
        photo_url,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка при добавлении автомобиля:", err.message);
    res.status(500).json({ error: "Не удалось добавить автомобиль" });
  }
});

// PUT /api/cars/1
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const {
    country,
    brand,
    model,
    year,
    price,
    drive,
    gearbox,
    body,
    mileage,
    engine_power: power,
    description,
    photo_url,
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE cars SET
        country = $1,
        brand = $2,
        model = $3,
        year = $4,
        price = $5,
        drive = $6,
        gearbox = $7,
        body = $8,
        mileage = $9,
        engine_power = $10,
        description = $11,
        photo_url = $12
      WHERE id = $13
      RETURNING *`,
      [
        country,
        brand,
        model,
        year,
        price,
        drive,
        gearbox,
        body,
        mileage,
        power,
        description,
        photo_url,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Автомобиль не найден" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка при обновлении автомобиля:", err.message);
    res.status(500).json({ error: "Не удалось обновить автомобиль" });
  }
});

// DELETE /api/cars/:id — удаление автомобиля
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM cars WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Автомобиль не найден" });
    }

    res.json({ message: "Автомобиль успешно удалён", car: result.rows[0] });
  } catch (err) {
    console.error("Ошибка при удалении автомобиля:", err.message);
    res.status(500).json({ error: "Не удалось удалить автомобиль" });
  }
});


module.exports = router;
