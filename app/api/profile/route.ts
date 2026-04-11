import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { getUserById, updateUser, updateUserPassword } from "@/app/lib/db";

const SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-please-change-this";

export async function PATCH(request: NextRequest) {
  const token = await getToken({ req: request, secret: SECRET });
  const userId = token?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Acceso no autorizado." }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, currentPassword, newPassword } = body as {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const responseData: { user?: { id: string; name: string; email: string; role: string }; passwordUpdated?: boolean } = {};

  if (name || email) {
    try {
      const updatedUser = await updateUser(userId, { name, email });
      if (!updatedUser) {
        return NextResponse.json({ error: "No se pudo actualizar el perfil." }, { status: 400 });
      }
      responseData.user = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      };
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  }

  if (newPassword !== undefined) {
    if (!newPassword?.trim() || newPassword.length < 6) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const isGoogleUser = user.provider === "google";

    if (!currentPassword?.trim() && !isGoogleUser) {
      return NextResponse.json(
        { error: "Debes proporcionar tu contraseña actual para cambiar la contraseña." },
        { status: 400 }
      );
    }

    if (currentPassword?.trim()) {
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400 });
      }
    }

    const updated = await updateUserPassword(userId, newPassword);
    if (!updated) {
      return NextResponse.json({ error: "No se pudo actualizar la contraseña." }, { status: 400 });
    }
    responseData.passwordUpdated = true;
  }

  if (!responseData.user && !responseData.passwordUpdated) {
    return NextResponse.json({ error: "No se proporcionaron cambios válidos." }, { status: 400 });
  }

  return NextResponse.json({ success: true, ...responseData });
}