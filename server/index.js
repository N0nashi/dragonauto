require("dotenv").config();
const { rateLimit } = require("express-rate-limit");
const app = require("./app");

const PORT = process.env.PORT || 5000;

// Rate limiting на auth-эндпоинты (защита от брутфорса)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов, попробуйте позже" },
});
app.use("/api/login",           authLimiter);
app.use("/api/forgot-password", authLimiter);
app.use("/api/reset-password",  authLimiter);
app.use("/api/verify-email",    authLimiter);
app.use("/api/register",        authLimiter);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
