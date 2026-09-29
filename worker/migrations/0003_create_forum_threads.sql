CREATE TABLE IF NOT EXISTS forum_threads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS forum_threads_created_at ON forum_threads(created_at DESC);
