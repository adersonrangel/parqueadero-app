import initSqlJs, { Database } from "sql.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "..", "parqueadero.db");
let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      fecha_registro TEXT NOT NULL DEFAULT (date('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mensualidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT NOT NULL,
      valor_pagado REAL NOT NULL,
      fecha_pago TEXT NOT NULL DEFAULT (date('now')),
      mes TEXT NOT NULL,
      anio INTEGER NOT NULL,
      FOREIGN KEY (placa) REFERENCES usuarios(placa)
    )
  `);

  saveDatabase();
  return db;
}

export function saveDatabase(): void {
  if (!db) throw new Error("Database not initialized");
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function getDatabase(): Database {
  if (!db) throw new Error("Database not initialized");
  return db;
}
