ALTER TABLE forum_threads ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS forum_replies (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS forum_replies_thread_created_at ON forum_replies(thread_id, created_at ASC);
