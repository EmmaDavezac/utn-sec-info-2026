import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { initDb } from "@/app/lib/db";

let initialized = false;

async function handler(req: Request, ctx: unknown) {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
  const nextAuthHandler = NextAuth(authOptions);
  return nextAuthHandler(req, ctx);
}

export { handler as GET, handler as POST };