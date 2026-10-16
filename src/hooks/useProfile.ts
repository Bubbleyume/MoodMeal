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
  const [stored, setProfile] = useLocalStorage<UserProfile>(
    STORAGE_KEYS.profile,
    DEFAULT_PROFILE
  );
  // Profiles saved by older versions may lack fields; fill them from defaults
  // on read so screens never see undefined (the stored value is not rewritten).
  const profile: UserProfile = { ...DEFAULT_PROFILE, ...stored };

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setProfile((prev) => ({ ...DEFAULT_PROFILE, ...prev, ...patch }));
    },
    [setProfile]
  );

  return { profile, updateProfile };
}
