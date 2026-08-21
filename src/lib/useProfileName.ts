"use client";

import { useSyncExternalStore } from "react";
import { useSession } from "@/lib/fakeAuth";

const NAME_EVENT = "profile-name-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(NAME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(NAME_EVENT, callback);
  };
}

export function useProfileName() {
  const { data: session } = useSession();
  const stored = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem("user_display_name"),
    () => null,
  );

  const updateName = (newName: string) => {
    localStorage.setItem("user_display_name", newName);
    window.dispatchEvent(new Event(NAME_EVENT));
  };

  return { name: stored || session?.user?.name || "", updateName };
}
