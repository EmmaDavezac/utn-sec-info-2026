import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { updateUser, checkDniExists, saveStudentDni } from "@/app/lib/db";

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
    if (!userEmail) {
      return NextResponse.json({ error: "No se pudo obtener el email del usuario." }, { status: 400 });
    }
    const userId = (session.user as any).id;

    // Check DNI duplicates
    const dniInUse = await checkDniExists(dni);
    if (dniInUse) {
      return NextResponse.json({ error: "El DNI ya está registrado en el sistema." }, { status: 409 });
    }

    // Ensure student record exists and update it
    await saveStudentDni(userEmail, name, dni);

    // Update name in users table (this will automatically sync name to students table too)
    await updateUser(userId, { name: name.trim() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in google-onboarding:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 });
  }
}
