import { useCallback, useEffect, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS } from "../lib/storage";
import { normalizeAvatarConfig } from "../data/avatarMigration";
import type { AvatarConfig } from "../types/avatar";

/**
 * The user's own avatar — identity only (see src/types/avatar.ts); mood
 * expressions are applied on top by <Avatar> at render time and never
 * stored here. `null` means the user hasn't created one yet, which is what
 * the Welcome screen uses to decide whether to send a first-time visitor
 * into onboarding. Persisted the same way as the rest of the profile, and
 * wiped by "Clear Local Data" since it's part of STORAGE_KEYS.
 *
 * Every read is passed through `normalizeAvatarConfig` so an avatar saved
 * under any older option set (presets, frames, retired hairstyle ids,
 * extra customization fields) still loads as a valid, current AvatarConfig
 * — see src/data/avatarMigration.ts. If normalization changed anything,
 * the effect below re-saves the normalized version once so future reads
 * don't need to re-migrate it.
 */
export function useAvatar() {
  const [rawAvatar, setRawAvatar, reset] = useLocalStorage<unknown>(STORAGE_KEYS.avatar, null);

  const avatar = useMemo(() => normalizeAvatarConfig(rawAvatar), [rawAvatar]);

  useEffect(() => {
    if (rawAvatar != null && JSON.stringify(rawAvatar) !== JSON.stringify(avatar)) {
      setRawAvatar(avatar);
    }
    // Only re-run when the raw stored value changes — `setRawAvatar` and
    // `avatar` are both derived from it in the same render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawAvatar]);

  const saveAvatar = useCallback(
    (config: AvatarConfig) => {
      setRawAvatar(normalizeAvatarConfig(config));
    },
    [setRawAvatar]
  );

  const updateAvatar = useCallback(
    (patch: Partial<AvatarConfig>) => {
      setRawAvatar((prev: unknown) => normalizeAvatarConfig({ ...(normalizeAvatarConfig(prev) ?? {}), ...patch }));
    },
    [setRawAvatar]
  );

  return { avatar, hasAvatar: avatar !== null, saveAvatar, updateAvatar, resetAvatar: reset };
}
