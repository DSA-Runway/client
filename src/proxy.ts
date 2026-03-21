import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth bypass — always allow all routes for demo
export async function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
