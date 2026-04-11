import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { initDb } from "@/app/lib/db";

const initPromise = initDb();

async function handler(req: Request, ctx: unknown) {
  await initPromise;
  const nextAuthHandler = NextAuth(authOptions);
  return nextAuthHandler(req, ctx);
}

export { handler as GET, handler as POST };