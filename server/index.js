const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const { router: uploadRouter, uploadMiddleware } = require("./routes/upload");
const carsRoutes = require("./routes/cars");
const applicationsRouter = require("./routes/applications");
const updateApplicationsRouter = require("./routes/updateApplications");
const partsRouter = require("./routes/parts"); 
const adminRoutes = require("./routes/adminRoutes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json()); // вместо bodyParser.json()

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Подключаем роуты
app.use("/api", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/upload", uploadRouter);
app.use("/api/cars", carsRoutes);
app.use("/api/applications", applicationsRouter);
app.use("/api/updateApplications", updateApplicationsRouter);
app.use("/api/parts", partsRouter); 
app.use("/api/adminRoutes", adminRoutes);

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});