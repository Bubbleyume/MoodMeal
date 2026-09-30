/**
 * A minimal client-side router used in place of `react-router-dom`, which
 * could not be installed in this environment (see README.md).
 *
 * It intentionally mirrors the react-router-dom v6 API surface we use
 * elsewhere in the app (BrowserRouter, Routes, Route, Link, useNavigate,
 * useParams, useLocation, Navigate) so that swapping in the real package
 * later is a matter of changing this file's import path, not rewriting
 * every page.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface RouterContextValue {
  pathname: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function getPathname() {
  return window.location.pathname || "/";
}

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState(getPathname());

  useEffect(() => {
    const onPopState = () => setPathname(getPathname());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    if (opts?.replace) {
      window.history.replaceState({}, "", to);
    } else {
      window.history.pushState({}, "", to);
    }
    setPathname(getPathname());
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const value = useMemo(() => ({ pathname, navigate }), [pathname, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("Router hooks must be used inside <BrowserRouter>");
  return ctx;
}

export interface RouteProps {
  path: string;
  element: React.ReactNode;
}

/** Declarative marker consumed by <Routes>; never rendered directly. */
export function Route(_props: RouteProps): null {
  return null;
}

function patternToRegex(pattern: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = [];
  const regexStr = pattern
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        keys.push(segment.slice(1));
        return "([^/]+)";
      }
      if (segment === "*") {
        keys.push("*");
        return "(.*)";
      }
      return segment.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return { regex: new RegExp(`^${regexStr}$`), keys };
}

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const { regex, keys } = patternToRegex(pattern);
  const match = pathname.match(regex);
  if (!match) return null;
  const params: Record<string, string> = {};
  keys.forEach((key, i) => {
    params[key] = decodeURIComponent(match[i + 1] ?? "");
  });
  return params;
}

const ParamsContext = createContext<Record<string, string>>({});

export function Routes({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();
  const routeArray = React.Children.toArray(children) as React.ReactElement<RouteProps>[];

  for (const child of routeArray) {
    if (!React.isValidElement(child)) continue;
    const props = child.props as RouteProps;
    const { path, element } = props;
    const params = matchPath(path, pathname);
    if (params) {
      return <ParamsContext.Provider value={params}>{element}</ParamsContext.Provider>;
    }
  }
  return null;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const { navigate } = useRouter();
  useEffect(() => {
    navigate(to, { replace });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return null;
}

export function Link({
  to,
  children,
  className,
  onClick,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onClick?.(e);
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

export function useNavigate() {
  const { navigate } = useRouter();
  return navigate;
}

export function useLocation() {
  const { pathname } = useRouter();
  return { pathname };
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useContext(ParamsContext) as T;
}

/** Convenience wrapper around the browser's native back navigation. */
export function useGoBack() {
  return useCallback(() => window.history.back(), []);
}
