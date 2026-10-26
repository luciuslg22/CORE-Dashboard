const Database = require("better-sqlite3");
const path = require("path");

const banco = new Database(
    path.join(__dirname, "core.db")
);

banco.pragma("journal_mode = WAL");

banco.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        usuario TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        patente TEXT NOT NULL,
        interna TEXT NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1
    )
`);

module.exports = banco;