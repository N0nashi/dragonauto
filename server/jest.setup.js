// Устанавливаем переменные окружения ДО загрузки любых модулей
process.env.JWT_SECRET      = "test-jwt-secret-dragonauto";
process.env.DATABASE_URL    = "postgresql://test:test@localhost/test_db";
process.env.NODE_ENV        = "test";
process.env.YANDEX_EMAIL    = "test@example.com";
process.env.YANDEX_PASSWORD = "test-password";
process.env.CORS_ORIGIN     = "http://localhost:3000";
