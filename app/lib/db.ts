import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function getDb() {
  return pool;
}

export async function initDb() {
  if (!process.env.DATABASE_URL) return;
  const client = await pool.connect();
  try {
    await client.query(`
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at BIGINT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT,
        provider TEXT,
        ip TEXT,
        user_agent TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const { rows } = await client.query("SELECT COUNT(*) AS count FROM users");
    const count = parseInt(rows[0].count, 10);

    if (count === 0) {
      const users = [
        { id: "1", name: "Administrador", email: "admin@example.com", password: "password123", role: "Administrador" },
        { id: "2", name: "Profesor", email: "profesor@example.com", password: "password123", role: "Profesor" },
        { id: "3", name: "Estudiante", email: "estudiante@example.com", password: "password123", role: "Estudiante" },
      ];

      for (const user of users) {
        const passwordHash = bcrypt.hashSync(user.password, 10);
        await client.query(
          "INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
          [user.id, user.name, user.email.toLowerCase(), passwordHash, user.role]
        );
      }
    }
  } finally {
    client.release();
  }
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

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function getPublicUserById(id: string): Promise<PublicUser | null> {
  const { rows } = await pool.query(
    "SELECT id, name, email, role, provider, active FROM users WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function getAllUsers(): Promise<PublicUser[]> {
  const { rows } = await pool.query(
    "SELECT id, name, email, role, provider, active FROM users ORDER BY name ASC"
  );
  return rows;
}

export async function getStudentsByRole(role: string): Promise<PublicUser[]> {
  const { rows } = await pool.query(
    "SELECT id, name, email, role, provider, active FROM users WHERE LOWER(role) = $1 AND active = 1 ORDER BY name ASC",
    [role.toLowerCase()]
  );
  return rows;
}

export async function updateUserRole(id: string, role: string): Promise<PublicUser | null> {
  await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
  return getPublicUserById(id);
}

export async function updateUser(
  id: string,
  updates: { name?: string; email?: string; role?: string; active?: boolean }
): Promise<PublicUser | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const params: Array<string | boolean | number> = [];
  let idx = 1;

  if (typeof updates.name === "string") {
    const trimmedName = updates.name.trim();
    if (!trimmedName) throw new Error("El nombre no puede estar vacío.");
    fields.push(`name = $${idx++}`);
    params.push(trimmedName);
  }

  if (typeof updates.email === "string") {
    const normalizedEmail = updates.email.toLowerCase().trim();
    if (!normalizedEmail) throw new Error("El correo no puede estar vacío.");
    const otherUser = await getUserByEmail(normalizedEmail);
    if (otherUser && otherUser.id !== id) throw new Error("El correo ya está en uso.");
    fields.push(`email = $${idx++}`);
    params.push(normalizedEmail);
  }

  if (typeof updates.role === "string") {
    const trimmedRole = updates.role.trim();
    if (!trimmedRole) throw new Error("El rol no puede estar vacío.");
    if (!["Administrador", "Profesor", "Estudiante"].includes(trimmedRole)) throw new Error("Rol inválido.");
    fields.push(`role = $${idx++}`);
    params.push(trimmedRole);
  }

  if (typeof updates.active === "boolean") {
    fields.push(`active = $${idx++}`);
    params.push(updates.active ? 1 : 0);
  }

  if (fields.length > 0) {
    params.push(id);
    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`, params);
  }

  return getPublicUserById(id);
}

export async function updateUserPassword(id: string, newPassword: string): Promise<boolean> {
  const existing = await getUserById(id);
  if (!existing) return false;
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  const { rowCount } = await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
  return (rowCount ?? 0) > 0;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("UPDATE users SET active = 0 WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

export async function createUser(name: string, email: string, password: string, role = "Estudiante") {
  const passwordHash = bcrypt.hashSync(password, 10);
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO users (id, name, email, password_hash, role, provider, active) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, name.trim(), email.toLowerCase(), passwordHash, role, "credentials", 1]
  );
  return { id, name: name.trim(), email: email.toLowerCase(), role };
}

export async function createOAuthUser(name: string, email: string, role = "Estudiante") {
  const randomPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = bcrypt.hashSync(randomPassword, 10);
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO users (id, name, email, password_hash, role, provider, active) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, name.trim(), email.toLowerCase(), passwordHash, role, "google", 1]
  );
  return { id, name: name.trim(), email: email.toLowerCase(), role };
}

export function verifyPassword(passwordHash: string, plainPassword: string): boolean {
  return bcrypt.compareSync(plainPassword, passwordHash);
}

export async function changePassword(id: string, newPassword: string): Promise<boolean> {
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  const { rowCount } = await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
  return (rowCount ?? 0) > 0;
}

export async function createResetToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 1000 * 60 * 60;
  await pool.query(
    "INSERT INTO reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)",
    [token, userId, expiresAt]
  );
  return token;
}

export async function getResetToken(token: string): Promise<{ token: string; userId: string; expiresAt: number } | null> {
  const { rows } = await pool.query(
    "SELECT token, user_id AS \"userId\", expires_at AS \"expiresAt\" FROM reset_tokens WHERE token = $1 AND expires_at > $2",
    [token, Date.now()]
  );
  return rows[0] ?? null;
}

export async function deleteResetToken(token: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM reset_tokens WHERE token = $1", [token]);
  return (rowCount ?? 0) > 0;
}

export async function saveLoginLog(data: {
  userId: string;
  email?: string | null;
  provider?: string;
  ip?: string;
  userAgent?: string;
}) {
  await pool.query(
    "INSERT INTO login_logs (user_id, email, provider, ip, user_agent) VALUES ($1, $2, $3, $4, $5)",
    [data.userId, data.email || null, data.provider || "credentials", data.ip || "unknown", data.userAgent || "unknown"]
  );
}

export async function getRecentLogs(limit = 50) {
  const { rows } = await pool.query("SELECT * FROM login_logs ORDER BY timestamp DESC LIMIT $1", [limit]);
  return rows;
}