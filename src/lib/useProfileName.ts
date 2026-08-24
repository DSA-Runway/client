"use client";

import { useSession } from "@/lib/fakeAuth";
import { useState, useEffect } from "react";

export function useProfileName() {
  const { data: session } = useSession();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => {
      const stored = typeof window !== "undefined" ? localStorage.getItem("user_display_name") : null;
      if (stored) {
        setName(stored);
      } else if (session?.user?.name) {
        setName(session.user.name);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [session]);

  const updateName = (newName: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_display_name", newName);
    }
    setName(newName);
  };

  return { name, updateName };
}
