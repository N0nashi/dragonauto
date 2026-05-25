/**
 * Тесты: Каталог автомобилей
 * Маршруты: GET /api/cars, GET /api/cars/:id
 */
jest.mock("../db");

const request = require("supertest");
const app     = require("../app");
const db      = require("../db");

const SAMPLE_CAR = {
  id: 1, brand: "Toyota", model: "Camry", year: 2023,
  price: 3500000, country: "Япония", status: "approved",
  mileage: 0, body: "Седан", gearbox: "АКПП",
  drive: "Передний", engine_power: 180, photo_url: null,
};

describe("GET /api/cars", () => {
  beforeEach(() => jest.clearAllMocks());

  test("200 — возвращает массив одобренных автомобилей", async () => {
    // cars.js делает несколько запросов (filters + список), мокаем оба
    db.query
      .mockResolvedValueOnce({ rows: [SAMPLE_CAR], rowCount: 1 }) // список авто
      .mockResolvedValueOnce({ rows: [{ count: "1" }] });          // total count

    const res = await request(app).get("/api/cars");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.cars ?? res.body)).toBe(true);
  });

  test("200 — принимает параметры фильтрации без ошибок", async () => {
    db.query.mockResolvedValue({ rows: [], rowCount: 0 });

    const res = await request(app)
      .get("/api/cars")
      .query({ brand: "Toyota", country: "Япония", minPrice: "1000000" });

    expect(res.status).toBe(200);
  });
});

describe("GET /api/cars/filters", () => {
  beforeEach(() => jest.clearAllMocks());

  test("200 — возвращает объект с брендами, моделями, странами", async () => {
    const emptyRows = { rows: [] };
    db.query.mockResolvedValue(emptyRows);

    const res = await request(app).get("/api/cars/filters");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("brands");
    expect(res.body).toHaveProperty("countries");
  });
});

describe("GET /api/cars/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  test("200 — возвращает автомобиль по ID", async () => {
    db.query.mockResolvedValueOnce({ rows: [SAMPLE_CAR], rowCount: 1 });

    const res = await request(app).get("/api/cars/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("brand", "Toyota");
    expect(res.body).toHaveProperty("model", "Camry");
  });

  test("404 — автомобиль не найден", async () => {
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get("/api/cars/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
