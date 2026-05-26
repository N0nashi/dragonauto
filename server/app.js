const express = require("express");
const cors    = require("cors");
const path    = require("path");
const helmet  = require("helmet");

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

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS — разрешаем preflight и все запросы с нужных origin
const corsOptions = {
  origin: true,       // зеркалит Origin заголовок — разрешает любой origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
