import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { getUserById, verifyPassword, changePassword } from "@/app/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Las contraseñas son requeridas" }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!verifyPassword(user.password_hash, currentPassword)) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 401 });
    }

    const success = await changePassword(userId, newPassword);
    if (!success) {
      return NextResponse.json({ error: "No se pudo cambiar la contraseña" }, { status: 400 });
    }

    return NextResponse.json({ message: "Contraseña cambiada exitosamente" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}