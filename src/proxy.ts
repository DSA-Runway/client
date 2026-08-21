import { NextResponse } from "next/server";

// Auth bypass — always allow all routes for demo
export async function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
