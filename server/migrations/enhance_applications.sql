-- Migration: enhance_applications
-- Adds: offered_price column, status constraint, comments table, notifications table

-- 1. Normalize existing cancelled status (neuter → feminine)
UPDATE applications SET status = 'отменена' WHERE status = 'отменено';

-- 2. Add offered_price column for the 'предложение' status
ALTER TABLE applications ADD COLUMN IF NOT EXISTS offered_price NUMERIC(15,2) DEFAULT NULL;

-- 3. Add CHECK constraint for the 6-status pipeline
ALTER TABLE applications
  ADD CONSTRAINT chk_application_status CHECK (status IN (
    'в обработке',
    'в работе',
    'предложение',
    'согласована',
    'выполнена',
    'отменена'
  ));

-- 4. Comments thread per application
CREATE TABLE IF NOT EXISTS application_comments (
  id             SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  author_role    VARCHAR(10) NOT NULL CHECK (author_role IN ('user', 'admin')),
  author_name    VARCHAR(255) NOT NULL,
  message        TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_app_id ON application_comments(application_id);

-- 5. Per-user unread notifications (status changes + new admin comments)
CREATE TABLE IF NOT EXISTS application_notifications (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type           VARCHAR(20) NOT NULL CHECK (type IN ('status_change', 'new_comment')),
  is_read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread
  ON application_notifications(user_id, is_read)
  WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_app_id
  ON application_notifications(application_id);
