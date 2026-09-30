import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS } from "../lib/storage";
import type { UserProfile } from "../types";

export const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  dietaryPreference: "none",
  notificationsEnabled: true,
};

export function useProfile() {
  const [profile, setProfile] = useLocalStorage<UserProfile>(
    STORAGE_KEYS.profile,
    DEFAULT_PROFILE
  );

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setProfile((prev) => ({ ...prev, ...patch }));
    },
    [setProfile]
  );

  return { profile, updateProfile };
}
