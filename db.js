const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "shelves.db");
const db = new Database(dbPath);

// le chiavi esterne non sono attive di default in SQLite
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS franchises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    franchise_id TEXT NOT NULL,
    title TEXT NOT NULL,
    original_console TEXT NOT NULL,
    has_remaster INTEGER NOT NULL DEFAULT 0,
    remaster_console TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS consoles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS emulators (
    id TEXT PRIMARY KEY,
    console_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (console_id) REFERENCES consoles(id) ON DELETE CASCADE
  );
`);

module.exports = db;
