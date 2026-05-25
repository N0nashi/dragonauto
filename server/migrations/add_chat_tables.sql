-- Run this migration to enable the chatbot/live-support feature

CREATE TABLE IF NOT EXISTS chat_sessions (
  id            SERIAL PRIMARY KEY,
  session_token VARCHAR(64) UNIQUE NOT NULL,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status        VARCHAR(20) DEFAULT 'bot',   -- bot | pending | active | closed
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender     VARCHAR(20) NOT NULL,            -- user | bot | admin
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_token   ON chat_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status  ON chat_sessions(status);
