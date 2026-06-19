import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { updateUser, getUserById } from "@/app/lib/db";
import { SqlInjectionGuard } from "@/app/lib/security/SqlInjectionGuard";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
    }

    // Validación SQL Injection a nivel de aplicación
    const nameVal = SqlInjectionGuard.validateInput(name, 'name', session.user.email ?? userId)
    const emailVal = SqlInjectionGuard.validateInput(email, 'email', session.user.email ?? userId)
    if (!nameVal.isValid || !emailVal.isValid) {
      return NextResponse.json(
        { error: "Entrada rechazaba debido a patrones de consulta no permitidos." },
        { status: 400 }
      );
    }

    const updated = await updateUser(userId, { name, email }, session.user.email ?? null);

    if (!updated) {
      return NextResponse.json({ error: "No se pudo actualizar el perfil" }, { status: 400 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
