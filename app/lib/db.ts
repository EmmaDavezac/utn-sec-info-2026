import path from "path";
import { existsSync, mkdirSync } from "fs";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import crypto from "crypto";
//Leemos el path de la base de datos desde una variable de entorno, o usamos un valor por defecto
const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(process.cwd(), "data", "secure-campus.sqlite");

const DB_DIR = path.dirname(DB_PATH);

let db: Database.Database | null = null;

function openDb() {
  if (db) return db;

  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = wal");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'credentials',
      active INTEGER NOT NULL DEFAULT 1
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reset_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);
  db.exec(`
  CREATE TABLE IF NOT EXISTS login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    email TEXT,
    provider TEXT,
    ip TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

  const columns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === "provider")) {
    db.prepare("ALTER TABLE users ADD COLUMN provider TEXT NOT NULL DEFAULT 'credentials'").run();
  }
  if (!columns.some((column) => column.name === "active")) {
    db.prepare("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1").run();
  }

  const row = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  const count = row.count;

  if (count === 0) {
    const users = [
      { id: "1", name: "Administrador", email: "admin@example.com", password: "password123", role: "Administrador" },
      { id: "2", name: "Profesor", email: "profesor@example.com", password: "password123", role: "Profesor" },
      { id: "3", name: "Estudiante", email: "estudiante@example.com", password: "password123", role: "Estudiante" },
    ];

    const insert = db.prepare(
      "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)"
    );

    for (const user of users) {
      const passwordHash = bcrypt.hashSync(user.password, 10);
      insert.run(user.id, user.name, user.email.toLowerCase(), passwordHash, user.role);
    }
  }

  return db;
}

export type DbUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  provider: string;
  active: boolean;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  provider: string;
  active: boolean;
};

export function getUserByEmail(email: string): DbUser | null {
  const database = openDb();
  return (
    database.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as DbUser | undefined
  ) ?? null;
}

export function getUserById(id: string): DbUser | null {
  const database = openDb();
  return (
    database.prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser | undefined
  ) ?? null;
}

export function getPublicUserById(id: string): PublicUser | null {
  const database = openDb();
  return (
    database
      .prepare("SELECT id, name, email, role, provider, active FROM users WHERE id = ?")
      .get(id) as PublicUser | undefined
  ) ?? null;
}

export function getAllUsers(): PublicUser[] {
  const database = openDb();
  return database
    .prepare("SELECT id, name, email, role, provider, active FROM users ORDER BY name ASC")
    .all() as PublicUser[];
}

export function getStudentsByRole(role: string): PublicUser[] {
  const database = openDb();
  return database
    .prepare("SELECT id, name, email, role, provider, active FROM users WHERE LOWER(role) = ? AND active = 1 ORDER BY name ASC")
    .all(role.toLowerCase()) as PublicUser[];
}

export function updateUserRole(id: string, role: string): PublicUser | null {
  const database = openDb();
  database.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  return getPublicUserById(id);
}

export function updateUser(
  id: string,
  updates: { name?: string; email?: string; role?: string; active?: boolean }
): PublicUser | null {
  const database = openDb();
  const existing = getUserById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const params: Array<string | boolean | number> = [];

  if (typeof updates.name === "string") {
    const trimmedName = updates.name.trim();
    if (!trimmedName) {
      throw new Error("El nombre no puede estar vacío.");
    }
    fields.push("name = ?");
    params.push(trimmedName);
  }

  if (typeof updates.email === "string") {
    const normalizedEmail = updates.email.toLowerCase().trim();
    if (!normalizedEmail) {
      throw new Error("El correo no puede estar vacío.");
    }
    const otherUser = getUserByEmail(normalizedEmail);
    if (otherUser && otherUser.id !== id) {
      throw new Error("El correo ya está en uso.");
    }
    fields.push("email = ?");
    params.push(normalizedEmail);
  }

  if (typeof updates.role === "string") {
    const trimmedRole = updates.role.trim();
    if (!trimmedRole) {
      throw new Error("El rol no puede estar vacío.");
    }
    if (!["Administrador", "Profesor", "Estudiante"].includes(trimmedRole)) {
      throw new Error("Rol inválido.");
    }
    fields.push("role = ?");
    params.push(trimmedRole);
  }

  if (typeof updates.active === "boolean") {
    fields.push("active = ?");
    params.push(updates.active ? 1 : 0);
  }

  if (fields.length > 0) {
    params.push(id);
    database.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  }

  return getPublicUserById(id);
}

export function updateUserPassword(id: string, newPassword: string): boolean {
  const database = openDb();
  const existing = getUserById(id);
  if (!existing) return false;

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  const result = database.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, id);
  return result.changes > 0;
}

export function deleteUser(id: string): boolean {
  const database = openDb();
  const result = database.prepare("UPDATE users SET active = 0 WHERE id = ?").run(id);
  return result.changes > 0;
}

export function createUser(name: string, email: string, password: string, role = "Estudiante") {
  const database = openDb();
  const passwordHash = bcrypt.hashSync(password, 10);
  const id = crypto.randomUUID();

  database
    .prepare(
      "INSERT INTO users (id, name, email, password_hash, role, provider, active) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, name.trim(), email.toLowerCase(), passwordHash, role, "credentials", 1);

  return { id, name: name.trim(), email: email.toLowerCase(), role };
}

export function createOAuthUser(name: string, email: string, role = "Estudiante") {
  const database = openDb();
  const randomPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = bcrypt.hashSync(randomPassword, 10);
  const id = crypto.randomUUID();

  database
    .prepare(
      "INSERT INTO users (id, name, email, password_hash, role, provider, active) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, name.trim(), email.toLowerCase(), passwordHash, role, "google", 1);

  return { id, name: name.trim(), email: email.toLowerCase(), role };
}

export function verifyPassword(passwordHash: string, plainPassword: string): boolean {
  return bcrypt.compareSync(plainPassword, passwordHash);
}

export function changePassword(id: string, newPassword: string): boolean {
  const database = openDb();
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  const result = database.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, id);
  return result.changes > 0;
}

export function createResetToken(userId: string): string {
  const database = openDb();
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hora

  database
    .prepare("INSERT INTO reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, expiresAt);

  return token;
}

export function getResetToken(token: string): { token: string; userId: string; expiresAt: number } | null {
  const database = openDb();
  const row = database
    .prepare("SELECT token, user_id AS userId, expires_at AS expiresAt FROM reset_tokens WHERE token = ? AND expires_at > ?")
    .get(token, Date.now()) as { token: string; userId: string; expiresAt: number } | undefined;

  return row ?? null;
}

export function deleteResetToken(token: string): boolean {
  const database = openDb();
  const result = database.prepare("DELETE FROM reset_tokens WHERE token = ?").run(token);
  return result.changes > 0;
}

export function saveLoginLog(data: { 
  userId: string; 
  email?: string | null; 
  provider?: string; 
  ip?: string; 
  userAgent?: string; 
}) {
  const database = openDb();
  return database
    .prepare(`
      INSERT INTO login_logs (user_id, email, provider, ip, user_agent) 
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      data.userId, 
      data.email || null, 
      data.provider || 'credentials', 
      data.ip || 'unknown', 
      data.userAgent || 'unknown'
    );
}

export function getRecentLogs(limit = 50) {
  const database = openDb();
  return database
    .prepare("SELECT * FROM login_logs ORDER BY timestamp DESC LIMIT ?")
    .all(limit);
}
