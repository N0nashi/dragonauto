-- Migration: moderator ↔ supplier interaction
-- Run once in your database

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS matched_item_id     INT,
  ADD COLUMN IF NOT EXISTS matched_item_type   VARCHAR(10),   -- 'car' | 'part'
  ADD COLUMN IF NOT EXISTS matched_supplier_id INT,
  ADD COLUMN IF NOT EXISTS supplier_status     VARCHAR(20);   -- 'pending' | 'confirmed' | 'declined'

CREATE TABLE IF NOT EXISTS supplier_messages (
  id             SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_role    VARCHAR(10)  NOT NULL CHECK (sender_role IN ('admin', 'supplier')),
  sender_name    VARCHAR(100),
  message        TEXT         NOT NULL,
  is_read        BOOLEAN      DEFAULT FALSE,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_messages_app ON supplier_messages(application_id);

-- Extend notification types to include supplier_match
ALTER TABLE application_notifications
  DROP CONSTRAINT IF EXISTS application_notifications_type_check;

ALTER TABLE application_notifications
  ADD CONSTRAINT application_notifications_type_check
  CHECK (type IN ('status_change', 'new_comment', 'supplier_match'));
