const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
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
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Статика фронтенда (React build) ──
const clientDist = path.join(__dirname, "../client/dist");
const distExists = fs.existsSync(path.join(clientDist, "index.html"));
if (distExists) {
  app.use(express.static(clientDist, { index: false }));
}

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

// API 404
app.use("/api", (req, res) => res.status(404).json({ error: "Маршрут не найден" }));

// SPA fallback — для всех не-API маршрутов отдаём index.html
app.get("*", (req, res) => {
  if (distExists) {
    res.sendFile(path.join(clientDist, "index.html"));
  } else {
    res.status(503).send("Frontend not built. Run: cd client && npm run build");
  }
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

module.exports = app;
