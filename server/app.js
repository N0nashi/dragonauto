const express = require("express");
const cors    = require("cors");
const path    = require("path");
const helmet  = require("helmet");
const { rateLimit } = require("express-rate-limit");

const authRoutes          = require("./routes/auth");
const profileRoutes       = require("./routes/profile");
const { router: uploadRouter } = require("./routes/upload");
const carsRoutes          = require("./routes/cars");
const applicationsRouter  = require("./routes/applications");
const updateApplicationsRouter = require("./routes/updateApplications");
const partsRouter         = require("./routes/parts");
const adminRoutes         = require("./routes/adminRoutes");
const supplierRoutes      = require("./routes/supplier");
const chatRoutes          = require("./routes/chat");
const notificationsRoutes = require("./routes/notifications");

const app = express();

// За nginx стоит один реверс-прокси — иначе req.ip у всех будет 127.0.0.1
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS — разрешаем preflight и все запросы с нужных origin
const corsOptions = {
  origin: true,       // зеркалит Origin заголовок — разрешает любой origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting — защита от флуда через консоль/скрипты

// Общий потолок на все API: останавливает массовый флуд любыми запросами
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов, попробуйте позже" },
});

// Жёсткий лимит на авторизацию — защита от брутфорса
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много попыток, попробуйте позже" },
});

// Лимит на запись (создание/изменение): не трогает GET, режет массовое добавление
const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET" || req.method === "OPTIONS",
  message: { error: "Слишком много операций подряд, попробуйте позже" },
});

app.use("/api", globalLimiter);
app.use(
  ["/api/login", "/api/register", "/api/forgot-password", "/api/reset-password", "/api/verify-email"],
  authLimiter
);
app.use("/api/applications", writeLimiter);
app.use("/api/supplier",     writeLimiter);
app.use("/api/upload",       writeLimiter);

app.use("/api",                authRoutes);
app.use("/api/profile",        profileRoutes);
app.use("/api/upload",         uploadRouter);
app.use("/api/cars",           carsRoutes);
app.use("/api/applications",   applicationsRouter);
app.use("/api/updateApplications", updateApplicationsRouter);
app.use("/api/parts",          partsRouter);
app.use("/api/admin",          adminRoutes);
app.use("/api/supplier",       supplierRoutes);
app.use("/api/chat",           chatRoutes);
app.use("/api/notifications",  notificationsRoutes);

// 404 для неизвестных маршрутов
app.use((req, res) => res.status(404).json({ error: "Маршрут не найден" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

module.exports = app;
