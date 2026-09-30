/**
 * A small hand-drawn set of line icons, used in place of `lucide-react`
 * (not installable in this environment — see README.md). Every icon shares
 * lucide's prop shape (size, color, strokeWidth, className) so switching
 * back to the real package later is a one-line import change per file.
 */
import React from "react";

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  color?: string;
}

function createIcon(displayName: string, paths: React.ReactNode) {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 24, strokeWidth = 2, color = "currentColor", className, ...rest }, ref) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...rest}
      >
        {paths}
      </svg>
    )
  );
  Icon.displayName = displayName;
  return Icon;
}

export const Home = createIcon(
  "Home",
  <>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
  </>
);

export const Heart = createIcon(
  "Heart",
  <path d="M12 20.5s-7.5-4.7-10-9.4C.4 7.7 2 4 5.6 4c2 0 3.4 1 4.4 2.4C11 5 12.4 4 14.4 4 18 4 19.6 7.7 18 11.1c-2.5 4.7-10 9.4-10 9.4Z" />
);

export const Sparkles = createIcon(
  "Sparkles",
  <>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    <path d="M12 8.5 13.4 12 17 13.4 13.4 15l-1.4 3.5-1.4-3.5L7 13.4 10.6 12Z" />
  </>
);

export const ChefHat = createIcon(
  "ChefHat",
  <>
    <path d="M6.5 12.5V19a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-6.5" />
    <path d="M6 12.7A3.5 3.5 0 0 1 7.2 6a3.9 3.9 0 0 1 7.6 0 3.5 3.5 0 0 1 3.9 3.3 3.5 3.5 0 0 1-1.2 3.4c-.4.4-1 .6-1.6.6H7.8c-.6 0-1.2-.2-1.6-.6Z" />
    <path d="M9 16h6" />
  </>
);

export const Salad = createIcon(
  "Salad",
  <>
    <path d="M4 12.5a8 8 0 0 1 16 0c0 .3 0 .5-.4.5H4.4c-.4 0-.4-.2-.4-.5Z" />
    <path d="M4.5 13h15L18 20H6.5Z" />
    <path d="M12 8V4M9 8.5 7.5 5.5M15 8.5 16.5 5.5" />
  </>
);

export const ShoppingCart = createIcon(
  "ShoppingCart",
  <>
    <circle cx="9.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
    <path d="M2.5 3h2l2.2 11.4a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.3L20.5 7.5H6.2" />
  </>
);

export const User = createIcon(
  "User",
  <>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5" />
  </>
);

export const Settings = createIcon(
  "Settings",
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1h-.2a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.2 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
  </>
);

export const ArrowLeft = createIcon("ArrowLeft", <path d="M19 12H5M11 6l-6 6 6 6" />);
export const ChevronLeft = createIcon("ChevronLeft", <path d="M15 18l-6-6 6-6" />);
export const ChevronRight = createIcon("ChevronRight", <path d="M9 18l6-6-6-6" />);
export const ChevronDown = createIcon("ChevronDown", <path d="M6 9l6 6 6-6" />);

export const Plus = createIcon("Plus", <path d="M12 5v14M5 12h14" />);
export const Minus = createIcon("Minus", <path d="M5 12h14" />);
export const X = createIcon("X", <path d="M18 6 6 18M6 6l12 12" />);
export const Check = createIcon("Check", <path d="M20 6 9 17l-5-5" />);
export const Trash2 = createIcon(
  "Trash2",
  <>
    <path d="M4 7h16" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9.5 7V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
    <path d="M10 11v6M14 11v6" />
  </>
);

export const Clock = createIcon(
  "Clock",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>
);

export const Flame = createIcon(
  "Flame",
  <path d="M12 21.5c-4 0-6.5-2.7-6.5-6.2C5.5 11 8 8.5 9 5.5c.4 1.6 1.4 2.6 2.3 3.5.4-1.3.4-2.7 0-4.5 3 1.6 5.2 5 5.2 8.8 0 3.9-2.5 8.2-4.5 8.2Z" />
);

export const TrendingUp = createIcon(
  "TrendingUp",
  <>
    <path d="M3 17l6-6 4 4 8-8.5" />
    <path d="M15 6h6v6" />
  </>
);

export const BookOpen = createIcon(
  "BookOpen",
  <>
    <path d="M12 6.5c-1.6-1.3-4-2-6.8-2-.7 0-1.2.5-1.2 1.2v11.6c0 .7.5 1.2 1.2 1.2 2.8 0 5.2.7 6.8 2 1.6-1.3 4-2 6.8-2 .7 0 1.2-.5 1.2-1.2V5.7c0-.7-.5-1.2-1.2-1.2-2.8 0-5.2.7-6.8 2Z" />
    <path d="M12 6.5v13" />
  </>
);

export const Bell = createIcon(
  "Bell",
  <>
    <path d="M6 9a6 6 0 1 1 12 0c0 4 1.3 5.5 1.3 5.5H4.7S6 13 6 9Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </>
);

export const Moon = createIcon(
  "Moon",
  <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
);

export const AlertCircle = createIcon(
  "AlertCircle",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v5.5" />
    <circle cx="12" cy="16.3" r="0.2" fill="currentColor" />
  </>
);

export const Info = createIcon(
  "Info",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="8" r="0.2" fill="currentColor" />
  </>
);

export const ClipboardList = createIcon(
  "ClipboardList",
  <>
    <rect x="5.5" y="4.5" width="13" height="16" rx="1.5" />
    <path d="M9 4.5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v.5" />
    <path d="M8.5 10.5h7M8.5 14h7M8.5 17.5h4.5" />
  </>
);

export const Apple = createIcon(
  "Apple",
  <>
    <path d="M12 8.5c1.8-2 4.6-2 5.9-.3 1.6 2 1.3 6.4-1 9.3-1 1.3-2 2-3.4 2s-1.9-.7-2.4-.7-1.1.7-2.5.7-2.6-1-3.5-2.4c-1.9-2.9-1.9-7 0-9C6.3 6.6 8.6 6.5 10 8.2" />
    <path d="M12 8c-.3-1.8.6-3.3 2.2-4" />
  </>
);

export const Leaf = createIcon(
  "Leaf",
  <>
    <path d="M5 19c9 0 14-5 14-14-9 0-14 5-14 14Z" />
    <path d="M5 19c2-4 5-7 9-9" />
  </>
);

export const Sun = createIcon(
  "Sun",
  <>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
  </>
);

export const RefreshCw = createIcon(
  "RefreshCw",
  <>
    <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5" />
    <path d="M4 4v4.5h4.5" />
    <path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5" />
    <path d="M20 20v-4.5h-4.5" />
  </>
);

export const Frown = createIcon(
  "Frown",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 15.5c.9-1.2 2.1-1.8 3.5-1.8s2.6.6 3.5 1.8" />
    <circle cx="9" cy="10" r="0.2" fill="currentColor" />
    <circle cx="15" cy="10" r="0.2" fill="currentColor" />
  </>
);

export const Meh = createIcon(
  "Meh",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 15h7" />
    <circle cx="9" cy="10" r="0.2" fill="currentColor" />
    <circle cx="15" cy="10" r="0.2" fill="currentColor" />
  </>
);

export const Smile = createIcon(
  "Smile",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 13.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" />
    <circle cx="9" cy="10" r="0.2" fill="currentColor" />
    <circle cx="15" cy="10" r="0.2" fill="currentColor" />
  </>
);

export const MapPinCheck = createIcon(
  "MapPinCheck",
  <>
    <path d="M19 10.5c0 5-7 10.5-7 10.5s-7-5.5-7-10.5a7 7 0 1 1 14 0Z" />
    <path d="M9.5 10.2l1.6 1.7 3-3.4" />
  </>
);

export const Egg = createIcon(
  "Egg",
  <path d="M12 2.5c3.5 0 7 6.5 7 11.5a7 7 0 1 1-14 0c0-5 3.5-11.5 7-11.5Z" />
);

export const Droplet = createIcon(
  "Droplet",
  <path d="M12 2.5s6.5 7.4 6.5 12A6.5 6.5 0 0 1 5.5 14.5c0-4.6 6.5-12 6.5-12Z" />
);

export const Search = createIcon(
  "Search",
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-4.8-4.8" />
  </>
);
