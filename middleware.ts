import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth",
  },
});

export const config = {
  matcher: [
    "/",
    "/students/:path*",
    "/admin/:path*",
    "/api/student/:path*",
    "/api/chat/:path*",
  ],
};
