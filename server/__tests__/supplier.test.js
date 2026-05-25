/**
 * Тесты: Панель поставщика
 * Маршруты: GET /api/supplier/listings,
 *           POST /api/supplier/cars, POST /api/supplier/parts,
 *           PATCH /api/supplier/moderate, GET /api/supplier/pending
 */
jest.mock("../db");
jest.mock("../utils/mailer", () => ({ sendMail: jest.fn().mockResolvedValue(true) }), { virtual: true });

const request = require("supertest");
const app     = require("../app");
const db      = require("../db");
const { authHeader } = require("./helpers");

function mockAuth(role = "supplier", id = 5) {
  db.query.mockResolvedValueOnce({ rows: [{ role }] }); // authMiddleware
}

// ───────────────────────────────────────────────
// GET /api/supplier/listings
// ───────────────────────────────────────────────
describe("GET /api/supplier/listings", () => {
  beforeEach(() => jest.clearAllMocks());

  test("401 — без авторизации доступ запрещён", async () => {
    const res = await request(app).get("/api/supplier/listings");
    expect(res.status).toBe(401);
  });

  test("403 — клиент не является поставщиком", async () => {
    // authMiddleware возвращает role
    db.query.mockResolvedValueOnce({ rows: [{ role: "client" }] });
    // isSupplier делает SELECT is_blocked
    db.query.mockResolvedValueOnce({ rows: [{ is_blocked: false }] });

    const res = await request(app)
      .get("/api/supplier/listings")
      .set(authHeader(1, "client"));

    expect(res.status).toBe(403);
  });

  test("200 — поставщик получает список своих товаров", async () => {
    mockAuth("supplier", 5);
    // isSupplier: проверка блокировки
    db.query.mockResolvedValueOnce({ rows: [{ is_blocked: false }] });
    // SELECT cars
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, brand: "BYD", model: "Tang L", year: 2025, type: "car" }] });
    // SELECT parts
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/supplier/listings")
      .set(authHeader(5, "supplier"));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("brand", "BYD");
  });
});

// ───────────────────────────────────────────────
// POST /api/supplier/cars
// ───────────────────────────────────────────────
describe("POST /api/supplier/cars", () => {
  beforeEach(() => jest.clearAllMocks());

  const validCar = {
    brand: "Geely", model: "Monjaro", year: 2024,
    price: 4200000, country: "Китай",
  };

  test("201 — поставщик добавляет автомобиль, статус pending", async () => {
    mockAuth("supplier", 5);
    db.query.mockResolvedValueOnce({ rows: [{ is_blocked: false }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 10 }] }); // INSERT RETURNING

    const res = await request(app)
      .post("/api/supplier/cars")
      .set(authHeader(5, "supplier"))
      .send(validCar);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id", 10);
    expect(res.body.message).toMatch(/модерацию/i);
  });

  test("400 — не заполнены обязательные поля", async () => {
    mockAuth("supplier", 5);
    db.query.mockResolvedValueOnce({ rows: [{ is_blocked: false }] });

    const res = await request(app)
      .post("/api/supplier/cars")
      .set(authHeader(5, "supplier"))
      .send({ brand: "Geely" }); // нет model, year, price, country

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("403 — заблокированный поставщик не может добавить товар", async () => {
    mockAuth("supplier", 5);
    db.query.mockResolvedValueOnce({ rows: [{ is_blocked: true }] }); // заблокирован

    const res = await request(app)
      .post("/api/supplier/cars")
      .set(authHeader(5, "supplier"))
      .send(validCar);

    expect(res.status).toBe(403);
  });
});

// ───────────────────────────────────────────────
// POST /api/supplier/parts
// ───────────────────────────────────────────────
describe("POST /api/supplier/parts", () => {
  beforeEach(() => jest.clearAllMocks());

  test("201 — поставщик добавляет запчасть, статус pending", async () => {
    mockAuth("supplier", 5);
    db.query.mockResolvedValueOnce({ rows: [{ is_blocked: false }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 20 }] });

    const res = await request(app)
      .post("/api/supplier/parts")
      .set(authHeader(5, "supplier"))
      .send({ part_name: "Тормозные колодки", price: 8500 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id", 20);
  });

  test("400 — не указано название или цена", async () => {
    mockAuth("supplier", 5);
    db.query.mockResolvedValueOnce({ rows: [{ is_blocked: false }] });

    const res = await request(app)
      .post("/api/supplier/parts")
      .set(authHeader(5, "supplier"))
      .send({ brand: "Bosch" }); // нет part_name, price

    expect(res.status).toBe(400);
  });
});

// ───────────────────────────────────────────────
// GET /api/supplier/pending — модерация (admin)
// ───────────────────────────────────────────────
describe("GET /api/supplier/pending", () => {
  beforeEach(() => jest.clearAllMocks());

  test("403 — поставщик не видит список на модерации", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ role: "supplier" }] });

    const res = await request(app)
      .get("/api/supplier/pending")
      .set(authHeader(5, "supplier"));

    expect(res.status).toBe(403);
  });

  test("200 — модератор получает товары на модерации", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ role: "moderator" }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, brand: "BYD", type: "car", status: "pending" }] }); // cars
    db.query.mockResolvedValueOnce({ rows: [] }); // parts

    const res = await request(app)
      .get("/api/supplier/pending")
      .set(authHeader(10, "moderator"));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ───────────────────────────────────────────────
// POST /api/supplier/moderate — одобрить/отклонить
// ───────────────────────────────────────────────
describe("POST /api/supplier/moderate", () => {
  beforeEach(() => jest.clearAllMocks());

  test("200 — модератор одобряет товар поставщика", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ role: "moderator" }] });
    db.query.mockResolvedValueOnce({ rowCount: 1 }); // UPDATE

    const res = await request(app)
      .post("/api/supplier/moderate")
      .set(authHeader(10, "moderator"))
      .send({ id: 1, type: "car", status: "approved" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/approved/i);
  });

  test("200 — модератор отклоняет товар", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ role: "moderator" }] });
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .post("/api/supplier/moderate")
      .set(authHeader(10, "moderator"))
      .send({ id: 1, type: "part", status: "rejected" });

    expect(res.status).toBe(200);
  });

  test("400 — передан недопустимый статус", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ role: "moderator" }] });

    const res = await request(app)
      .post("/api/supplier/moderate")
      .set(authHeader(10, "moderator"))
      .send({ id: 1, type: "car", status: "hacked" });

    expect(res.status).toBe(400);
  });
});
