"use client";

import { createContext, useContext } from "react";

const fakeSession = {
  user: {
    id: "demo-1",
    name: "DSA Learner",
    email: "learner@dsarunway.com",
  },
  expires: "2099-12-31T23:59:59.999Z",
};

const FakeAuthContext = createContext({
  data: fakeSession as typeof fakeSession | null,
  status: "authenticated" as "authenticated" | "loading" | "unauthenticated",
});

export function FakeAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <FakeAuthContext.Provider value={{ data: fakeSession, status: "authenticated" }}>
      {children}
    </FakeAuthContext.Provider>
  );
}

export function useSession() {
  return useContext(FakeAuthContext);
}

export function signOut(_opts?: Record<string, unknown>) {
  // no-op in demo mode
}

export function signIn(_provider?: string, _opts?: Record<string, unknown>) {
  // no-op in demo mode
}
