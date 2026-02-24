export { default } from "next-auth/middleware";

// Protect these routes — unauthenticated users will be redirected to /login
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/topics/:path*",
    "/visualizer/:path*",
  ],
};
