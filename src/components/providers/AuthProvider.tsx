"use client";

import { FakeAuthProvider } from "@/lib/fakeAuth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <FakeAuthProvider>{children}</FakeAuthProvider>;
}
