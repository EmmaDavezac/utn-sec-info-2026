import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { updateUser, checkDniExists, getPool } from "@/app/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { name, dni } = await request.json();
    if (!name?.trim() || !dni?.trim()) {
      return NextResponse.json({ error: "El nombre y el DNI son obligatorios." }, { status: 400 });
    }

    const dniRegex = /^\d{7,8}$/;
    if (!dniRegex.test(dni.trim())) {
      return NextResponse.json({ error: "El DNI debe ser un número de 7 u 8 dígitos." }, { status: 400 });
    }

    const userEmail = session.user.email;
    const userId = (session.user as any).id;

    // Check DNI duplicates
    const dniInUse = await checkDniExists(dni);
    if (dniInUse) {
      return NextResponse.json({ error: "El DNI ya está registrado en el sistema." }, { status: 409 });
    }

    const encryptionKey = process.env.DB_ENCRYPTION_KEY || 'DEMO_KEY_CHANGE_IN_PRODUCTION_12345';

    // Ensure student record exists and update it
    const { rowCount } = await getPool().query(
      "UPDATE students SET name = $1, dni_encrypted = encrypt_dni($2, $3) WHERE email = $4",
      [name.trim(), dni.trim(), encryptionKey, userEmail.toLowerCase()]
    );
    if ((rowCount ?? 0) === 0) {
      await getPool().query(
        "INSERT INTO students (name, email, active, dni_encrypted) VALUES ($1, $2, $3, encrypt_dni($4, $5))",
        [name.trim(), userEmail.toLowerCase(), true, dni.trim(), encryptionKey]
      );
    }

    // Update name in users table (this will automatically sync name to students table too)
    await updateUser(userId, { name: name.trim() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in google-onboarding:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 });
  }
}
