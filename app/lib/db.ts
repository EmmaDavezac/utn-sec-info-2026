import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

let poolInstance: Pool | null = null;

function getPool(): Pool {
  if (!poolInstance) {
    const connStr = process.env.DATABASE_URL;
    if (!connStr) {
      console.warn("[DB] WARNING: DATABASE_URL is undefined in process.env!");
    } else {
      console.log("[DB] Initializing PostgreSQL Pool. connectionString length:", connStr.length);
    }
    poolInstance = new Pool({
      connectionString: connStr,
    });
  }
  return poolInstance;
}

export async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("[DB] initDb skipped: DATABASE_URL is not set.");
    return;
  }
  const client = await getPool().connect();
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
        ip BYTEA,
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
  const { rows } = await getPool().query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const { rows } = await getPool().query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function getPublicUserById(id: string): Promise<PublicUser | null> {
  const { rows } = await getPool().query(
    "SELECT id, name, email, role, provider, active FROM users WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function getAllUsers(): Promise<PublicUser[]> {
  const { rows } = await getPool().query(
    "SELECT id, name, email, role, provider, active FROM users ORDER BY name ASC"
  );
  return rows;
}

export async function getStudentsByRole(role: string): Promise<PublicUser[]> {
  const { rows } = await getPool().query(
    "SELECT id, name, email, role, provider, active FROM users WHERE LOWER(role) = $1 AND active = 1 ORDER BY name ASC",
    [role.toLowerCase()]
  );
  return rows;
}

export async function updateUserRole(id: string, role: string): Promise<PublicUser | null> {
  await getPool().query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
  return getPublicUserById(id);
}

export async function updateUser(
  id: string,
  updates: { name?: string; email?: string; role?: string; active?: boolean }
): Promise<PublicUser | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  if (typeof updates.role === "string") {
    if (existing.role !== updates.role) {
      throw new Error("No está permitido modificar el rol de un usuario ya creado.");
    }
  }

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
    await getPool().query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`, params);
  }

  const updatedUser = await getPublicUserById(id);

  if (updatedUser && updatedUser.role === "Estudiante") {
    await syncStudentUpdate(
      existing.email,
      updatedUser.name,
      updatedUser.email,
      !!updatedUser.active
    );
  }

  return updatedUser;
}

export async function updateUserPassword(id: string, newPassword: string): Promise<boolean> {
  const existing = await getUserById(id);
  if (!existing) return false;
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  const { rowCount } = await getPool().query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
  return (rowCount ?? 0) > 0;
}

export async function deleteUser(id: string): Promise<boolean> {
  const existing = await getUserById(id);
  if (!existing) return false;

  const { rowCount } = await getPool().query("UPDATE users SET active = 0 WHERE id = $1", [id]);
  if ((rowCount ?? 0) > 0) {
    if (existing.role === "Estudiante") {
      await syncStudentUpdate(existing.email, existing.name, existing.email, false);
    }
    return true;
  }
  return false;
}

export async function createUser(name: string, email: string, password: string, role = "Estudiante", dni?: string) {
  const passwordHash = bcrypt.hashSync(password, 10);
  const id = crypto.randomUUID();
  await getPool().query(
    "INSERT INTO users (id, name, email, password_hash, role, provider, active) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, name.trim(), email.toLowerCase(), passwordHash, role, "credentials", 1]
  );

  if (role === "Estudiante") {
    const encryptionKey = process.env.DB_ENCRYPTION_KEY || 'DEMO_KEY_CHANGE_IN_PRODUCTION_12345';
    if (dni) {
      await getPool().query(
        "INSERT INTO students (name, email, active, dni_encrypted) VALUES ($1, $2, $3, encrypt_dni($4, $5)) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, active = EXCLUDED.active, dni_encrypted = EXCLUDED.dni_encrypted",
        [name.trim(), email.toLowerCase(), true, dni.trim(), encryptionKey]
      );
    } else {
      await getPool().query(
        "INSERT INTO students (name, email, active, dni_encrypted) VALUES ($1, $2, $3, NULL) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, active = EXCLUDED.active",
        [name.trim(), email.toLowerCase(), true]
      );
    }
  }

  return { id, name: name.trim(), email: email.toLowerCase(), role };
}

export async function createOAuthUser(name: string, email: string, role = "Estudiante") {
  const randomPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = bcrypt.hashSync(randomPassword, 10);
  const id = crypto.randomUUID();
  await getPool().query(
    "INSERT INTO users (id, name, email, password_hash, role, provider, active) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, name.trim(), email.toLowerCase(), passwordHash, role, "google", 1]
  );

  if (role === "Estudiante") {
    await getPool().query(
      "INSERT INTO students (name, email, active, dni_encrypted) VALUES ($1, $2, $3, NULL) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, active = EXCLUDED.active",
      [name.trim(), email.toLowerCase(), true]
    );
  }

  return { id, name: name.trim(), email: email.toLowerCase(), role };
}

export function verifyPassword(passwordHash: string, plainPassword: string): boolean {
  return bcrypt.compareSync(plainPassword, passwordHash);
}

export async function changePassword(id: string, newPassword: string): Promise<boolean> {
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  const { rowCount } = await getPool().query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
  return (rowCount ?? 0) > 0;
}

export async function createResetToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 1000 * 60 * 60;
  await getPool().query(
    "INSERT INTO reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)",
    [token, userId, expiresAt]
  );
  return token;
}

export async function getResetToken(token: string): Promise<{ token: string; userId: string; expiresAt: number } | null> {
  const { rows } = await getPool().query(
    "SELECT token, user_id AS \"userId\", expires_at AS \"expiresAt\" FROM reset_tokens WHERE token = $1 AND expires_at > $2",
    [token, Date.now()]
  );
  return rows[0] ?? null;
}

export async function deleteResetToken(token: string): Promise<boolean> {
  const { rowCount } = await getPool().query("DELETE FROM reset_tokens WHERE token = $1", [token]);
  return (rowCount ?? 0) > 0;
}

export async function saveLoginLog(data: {
  userId: string;
  email?: string | null;
  provider?: string;
  ip?: string;
  userAgent?: string;
}) {
  const encryptionKey = process.env.DB_ENCRYPTION_KEY || 'DEMO_KEY_CHANGE_IN_PRODUCTION_12345';
  await getPool().query(
    "INSERT INTO login_logs (user_id, email, provider, ip, user_agent) VALUES ($1, $2, $3, encrypt_ip($4, $5), $6)",
    [
      data.userId,
      data.email || null,
      data.provider || "credentials",
      data.ip || "unknown",
      encryptionKey,
      data.userAgent || "unknown"
    ]
  );
}

export async function getRecentLogs(limit = 50) {
  const encryptionKey = process.env.DB_ENCRYPTION_KEY || 'DEMO_KEY_CHANGE_IN_PRODUCTION_12345';
  const { rows } = await getPool().query(
    "SELECT id, user_id, email, provider, decrypt_ip(ip, $1) AS ip, user_agent, timestamp FROM login_logs ORDER BY timestamp DESC LIMIT $2",
    [encryptionKey, limit]
  );
  return rows;
}

export async function checkDniExists(dni: string): Promise<boolean> {
  const encryptionKey = process.env.DB_ENCRYPTION_KEY || 'DEMO_KEY_CHANGE_IN_PRODUCTION_12345';
  const { rows } = await getPool().query(
    "SELECT id FROM students WHERE decrypt_dni(dni_encrypted, $1) = $2",
    [encryptionKey, dni.trim()]
  );
  return rows.length > 0;
}

export async function syncStudentUpdate(previousEmail: string, name: string, email: string, active: boolean) {
  // Update existing student by previous email
  const { rowCount } = await getPool().query(
    "UPDATE students SET name = $1, email = $2, active = $3 WHERE email = $4",
    [name.trim(), email.toLowerCase(), active, previousEmail.toLowerCase()]
  );
  // If student row doesn't exist, insert it
  if ((rowCount ?? 0) === 0) {
    await getPool().query(
      "INSERT INTO students (name, email, active, dni_encrypted) VALUES ($1, $2, $3, NULL) ON CONFLICT (email) DO NOTHING",
      [name.trim(), email.toLowerCase(), active]
    );
  }
}

export async function userNeedsOnboarding(email: string, role: string): Promise<boolean> {
  const normalizedRole = (role ?? '').trim().toLowerCase();
  if (normalizedRole !== "estudiante" && normalizedRole !== "student") {
    return false;
  }
  const { rows } = await getPool().query(
    "SELECT dni_encrypted FROM students WHERE email = $1",
    [email.toLowerCase()]
  );
  if (rows.length === 0) {
    return true;
  }
  return rows[0].dni_encrypted === null;
}

export async function saveStudentDni(email: string, name: string, dni: string): Promise<void> {
  const encryptionKey = process.env.DB_ENCRYPTION_KEY || 'DEMO_KEY_CHANGE_IN_PRODUCTION_12345';
  const { rowCount } = await getPool().query(
    "UPDATE students SET name = $1, dni_encrypted = encrypt_dni($2, $3) WHERE email = $4",
    [name.trim(), dni.trim(), encryptionKey, email.toLowerCase()]
  );
  if ((rowCount ?? 0) === 0) {
    await getPool().query(
      "INSERT INTO students (name, email, active, dni_encrypted) VALUES ($1, $2, $3, encrypt_dni($4, $5))",
      [name.trim(), email.toLowerCase(), true, dni.trim(), encryptionKey]
    );
  }
}