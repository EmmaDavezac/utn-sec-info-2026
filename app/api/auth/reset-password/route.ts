import { NextRequest, NextResponse } from "next/server";
import { getResetToken, changePassword, deleteResetToken } from "@/app/lib/db";

export async function POST(request: NextRequest) {
  try {
    
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token y contraseña son requeridos" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const resetData = getResetToken(token);
    if (!resetData) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    const success = changePassword(resetData.userId, password);
    if (!success) {
      return NextResponse.json({ error: "Error al cambiar la contraseña" }, { status: 500 });
    }

    deleteResetToken(token);

    return NextResponse.json({ message: "Contraseña restablecida exitosamente" });
  } catch (error) {
    console.error("Error in reset password:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}