import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createResetToken } from "@/app/lib/db";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const user = getUserByEmail(email?.toLowerCase());

    if (user) {
      const token = createResetToken(user.id);
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${token}`;

      await transporter.sendMail({
        from: `"Soporte Secure Campus" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Restablece tu contraseña de Secure Campus",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
            <h2>Hola, ${user.name || 'usuario'}</h2>
            <p>Has solicitado restablecer tu contraseña de Secure Campus. Haz clic en el botón de abajo para continuar:</p>
            <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer Contraseña
            </a>
            <p>Si no solicitaste esto, puedes ignorar este correo.</p>
            <hr />
            <p style="font-size: 0.8rem; color: #666;">Este enlace expirará en 1 hora.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ 
      message: "Si el email existe, se enviará un enlace de restablecimiento" 
    });

  } catch (error) {
    console.error("Error enviando mail:", error);
    return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 });
  }
}