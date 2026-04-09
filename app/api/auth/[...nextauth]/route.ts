import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth"; // Importas la configuración desde tu librería

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };