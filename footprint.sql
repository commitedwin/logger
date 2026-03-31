CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT,
    user_agent TEXT,
    language TEXT,
    last_visited DATETIME DEFAULT CURRENT_TIMESTAMP
);