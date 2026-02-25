import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Protect these routes — unauthenticated users will be redirected to /login
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/topics/:path*",
    "/visualizer/:path*",
  ],
};
