import type { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import { saveLoginLog, createOAuthUser, getUserByEmail } from "@/app/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const providers: Provider[] = [
  CredentialsProvider({
    id: "credentials",
    name: "Credenciales",
    credentials: {
      email: { label: "Correo electrónico", type: "email" },
      password: { label: "Contraseña", type: "password" },
    },
    async authorize(credentials, req) {
      if (!credentials?.email || !credentials.password) return null;

      const user = getUserByEmail(credentials.email);
      if (!user || !user.active) return null;

      const isValid = await bcrypt.compare(credentials.password, user.password_hash);
      if (!isValid) return null;

      try {
        const ip = req?.headers?.["x-forwarded-for"] || "127.0.0.1";
        const userAgent = req?.headers?.["user-agent"] || "unknown";
        saveLoginLog({
          userId: user.id,
          email: user.email,
          provider: "credentials",
          ip: String(ip),
          userAgent: userAgent,
        });
      } catch (error) {
        console.error("Error al registrar log de acceso credentials:", error);
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    },
  }),
];

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId as string,
      clientSecret: googleClientSecret as string,
    })
  );
}


export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        let existingUser = getUserByEmail(user.email);

        if (existingUser) {
          // Usuario ya existe — verificar que esté activo
          if (!existingUser.active) return false;
        } else {
          // Usuario nuevo — crearlo en la DB
          createOAuthUser(
            user.name ?? user.email.split("@")[0],
            user.email,
            "Estudiante"
          );
          existingUser = getUserByEmail(user.email);
        }

        // Registrar log con el ID real de nuestra DB
        if (existingUser) {
          try {
            saveLoginLog({
              userId: existingUser.id,
              email: existingUser.email,
              provider: "google",
              ip: "OAuth-Provider",
              userAgent: "OAuth-Session",
            });
          } catch (error) {
            console.error("Error al registrar log de acceso OAuth:", error);
          }
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // Trigger "update" — relee siempre de la DB
      if (trigger === "update") {
        const dbUser = getUserByEmail(
          (session?.user?.email ?? token.email) as string
        );
        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.role = dbUser.role;
        }
        return token;
      }

      // Login inicial
      if (user) {
        const dbUser = getUserByEmail(user.email as string);
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name;
        } else {
          token.id = user.id;
          token.role = (user as any).role || "Estudiante";
        }
        return token;
      }

      // Requests subsiguientes — refrescamos desde la DB
      if (token.email) {
        const dbUser = getUserByEmail(token.email as string);
        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          name: token.name as string,
          email: token.email as string,
          role: token.role as string,
        } as any;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth",
  },

  secret: process.env.NEXTAUTH_SECRET || "dev-secret-please-change-this",
};