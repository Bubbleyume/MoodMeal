/**
 * Profile → Edit Avatar. Wraps AvatarCreator in "edit" mode, pre-filled
 * with the user's existing config (or the same inclusive default onboarding
 * uses, for the rare case someone reaches this without one). Saves back
 * through useAvatar() and returns to Profile.
 */
import { useNavigate } from "../lib/router";
import AvatarCreator from "../components/avatar/AvatarCreator";
import { useAvatar } from "../hooks/useAvatar";
import { DEFAULT_AVATAR_CONFIG } from "../data/avatarOptions";
import { ArrowLeft } from "../components/icons";

export default function AvatarEditorPage() {
  const navigate = useNavigate();
  const { avatar, saveAvatar } = useAvatar();

  return (
    <div className="mm-soft-bg flex h-full flex-1 flex-col">
      <div className="mm-gradient-bg flex items-center gap-3 px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <button
          onClick={() => navigate("/profile")}
          aria-label="Back to profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-xl font-extrabold">Edit Avatar</h1>
          <p className="text-xs text-white/70">Choose from three preset characters</p>
        </div>
      </div>

      <div className="screen-scroll -mt-4 flex-1 rounded-t-[2rem] px-5 pt-6">
        <AvatarCreator
          mode="edit"
          initialConfig={avatar ?? DEFAULT_AVATAR_CONFIG}
          onSave={(config) => {
            saveAvatar(config);
            navigate("/profile");
          }}
        />
      </div>
    </div>
  );
}
