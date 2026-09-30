/**
 * Hand-written ambient type declarations standing in for `@types/react` /
 * `@types/react-dom`, which could not be installed in this environment (no
 * package-registry access — see README.md). They cover exactly the React
 * API surface this codebase uses (hooks, common HTML/SVG attribute types,
 * forwardRef, the automatic JSX runtime) so `tsc --noEmit` can meaningfully
 * type-check the app's own code. They are intentionally looser than the
 * official types in places (e.g. broad element attribute bags) — installing
 * the real `@types/react`/`@types/react-dom` later and deleting this file
 * is a drop-in upgrade.
 *
 * IMPORTANT: this file must stay a plain ambient *script* — no top-level
 * `import`/`export` anywhere in it. The moment it becomes a module,
 * TypeScript treats the `declare module "react"` block below as an
 * *augmentation* of the real (untyped) package on disk instead of a full
 * ambient replacement, and everything here stops taking effect.
 */

declare module "react" {
  namespace React {
    // ---- Core node/element types -------------------------------------------
    type ReactNode = string | number | boolean | null | undefined | ReactElement | ReactNode[];

    interface ReactElement<P = any, T = any> {
      type?: T;
      props?: P;
      key?: string | number | null;
    }

    type Key = string | number;
    type Ref<T> = { current: T | null } | ((instance: T | null) => void) | null;
    interface RefObject<T> {
      current: T | null;
    }

    interface CSSProperties {
      [property: string]: string | number | undefined;
    }

    // ---- Synthetic events ---------------------------------------------------
    interface SyntheticEvent<T = Element> {
      currentTarget: T;
      target: EventTarget & T;
      preventDefault(): void;
      stopPropagation(): void;
      metaKey?: boolean;
      ctrlKey?: boolean;
      shiftKey?: boolean;
      altKey?: boolean;
    }
    interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
      target: EventTarget & T & { value: string };
    }
    interface FormEvent<T = Element> extends SyntheticEvent<T> {}
    interface MouseEvent<T = Element> extends SyntheticEvent<T> {
      clientX: number;
      clientY: number;
    }
    interface TouchEvent<T = Element> extends SyntheticEvent<T> {
      touches: { clientX: number; clientY: number }[];
    }
    interface KeyboardEvent<T = Element> extends SyntheticEvent<T> {
      key: string;
    }

    // ---- DOM attribute bags -------------------------------------------------
    // Deliberately loose (index signature) rather than enumerating every DOM
    // attribute/event — see file header.
    interface DOMAttributes<T> {
      children?: ReactNode;
      onClick?: (event: MouseEvent<T>) => void;
      onChange?: (event: ChangeEvent<T>) => void;
      onInput?: (event: FormEvent<T>) => void;
      onSubmit?: (event: FormEvent<T>) => void;
      onMouseMove?: (event: MouseEvent<T>) => void;
      onMouseEnter?: (event: MouseEvent<T>) => void;
      onMouseLeave?: (event: MouseEvent<T>) => void;
      onTouchStart?: (event: TouchEvent<T>) => void;
      onTouchMove?: (event: TouchEvent<T>) => void;
      onTouchEnd?: (event: TouchEvent<T>) => void;
      onKeyDown?: (event: KeyboardEvent<T>) => void;
      onFocus?: (event: FormEvent<T>) => void;
      onBlur?: (event: FormEvent<T>) => void;
      [handler: string]: any;
    }

    interface HTMLAttributes<T> extends DOMAttributes<T> {
      className?: string;
      id?: string;
      style?: CSSProperties;
      role?: string;
      tabIndex?: number;
      title?: string;
      ref?: Ref<T>;
      key?: Key | null;
      "aria-label"?: string;
      "aria-pressed"?: boolean | "true" | "false";
      "aria-hidden"?: boolean | "true" | "false";
      [attr: string]: any;
    }

    interface SVGAttributes<T> extends HTMLAttributes<T> {}
    interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: boolean;
      type?: "button" | "submit" | "reset";
    }
    interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
      href?: string;
    }
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: string | number;
      type?: string;
      placeholder?: string;
      disabled?: boolean;
      min?: number | string;
      max?: number | string;
      step?: number | string;
      maxLength?: number;
    }
    interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: string;
      rows?: number;
      maxLength?: number;
      placeholder?: string;
    }
    interface FormHTMLAttributes<T> extends HTMLAttributes<T> {}

    // ---- Component types -----------------------------------------------------
    type FC<P = {}> = (props: P) => ReactElement | null;
    type ComponentType<P = {}> = (props: P) => ReactElement | null;

    interface Context<T> {
      Provider: (props: { value: T; children?: ReactNode }) => ReactElement | null;
      Consumer: (props: { children: (value: T) => ReactNode }) => ReactElement | null;
    }

    interface ForwardRefExoticComponent<P> {
      (props: P): ReactElement | null;
      displayName?: string;
    }

    const StrictMode: (props: { children?: ReactNode }) => ReactElement | null;
    const Fragment: (props: { children?: ReactNode }) => ReactElement | null;

    // ---- Hooks -----------------------------------------------------------------
    function useState<S>(initial: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
    function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
    function useCallback<T extends (...args: any[]) => any>(fn: T, deps: readonly any[]): T;
    function useMemo<T>(factory: () => T, deps: readonly any[]): T;
    function useRef<T>(initial: T): RefObject<T>;
    function useRef<T = undefined>(): RefObject<T | undefined>;
    function useContext<T>(context: Context<T>): T;
    function createContext<T>(defaultValue: T): Context<T>;

    function forwardRef<T, P = {}>(
      render: (props: P, ref: Ref<T>) => ReactElement | null
    ): ForwardRefExoticComponent<P & { ref?: Ref<T> }>;

    function isValidElement(value: any): value is ReactElement;

    const Children: {
      toArray(children: ReactNode): ReactElement[];
      map<T>(children: ReactNode, fn: (child: ReactElement, index: number) => T): T[];
    };

    function createElement(...args: any[]): ReactElement;
  }

  export = React;
}

declare module "react-dom/client" {
  import type { ReactNode } from "react";
  interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }
  const ReactDOMClient: {
    createRoot(container: Element | DocumentFragment): Root;
  };
  export default ReactDOMClient;
}

declare module "react/jsx-runtime" {
  export const Fragment: unique symbol;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}

declare module "react/jsx-dev-runtime" {
  export * from "react/jsx-runtime";
}

declare module "*.css" {
  const noop: undefined;
  export default noop;
}

// Global JSX namespace consumed by the "react-jsx" automatic runtime's
// type-checking. Common intrinsic elements get real (if loose) attribute
// types so inline event handlers still get proper contextual parameter
// types; anything else falls back to a permissive index signature.
namespace JSX {
  type HTMLAttrs<T> = import("react").HTMLAttributes<T>;
  type SVGAttrs<T> = import("react").SVGAttributes<T> & { [attr: string]: any };

  interface Element extends import("react").ReactElement {}

  interface IntrinsicAttributes {
    key?: import("react").Key | null;
  }

  interface IntrinsicElements {
    div: HTMLAttrs<HTMLDivElement>;
    span: HTMLAttrs<HTMLSpanElement>;
    p: HTMLAttrs<HTMLParagraphElement>;
    a: HTMLAttrs<HTMLAnchorElement> & { href?: string };
    button: HTMLAttrs<HTMLButtonElement> & { disabled?: boolean; type?: string };
    input: HTMLAttrs<HTMLInputElement> & {
      value?: string | number;
      type?: string;
      placeholder?: string;
      disabled?: boolean;
      min?: number | string;
      max?: number | string;
      step?: number | string;
      maxLength?: number;
    };
    textarea: HTMLAttrs<HTMLTextAreaElement> & {
      value?: string;
      rows?: number;
      maxLength?: number;
      placeholder?: string;
    };
    form: HTMLAttrs<HTMLFormElement>;
    label: HTMLAttrs<HTMLLabelElement> & { htmlFor?: string };
    header: HTMLAttrs<HTMLElement>;
    nav: HTMLAttrs<HTMLElement>;
    h1: HTMLAttrs<HTMLHeadingElement>;
    h2: HTMLAttrs<HTMLHeadingElement>;
    h3: HTMLAttrs<HTMLHeadingElement>;
    ul: HTMLAttrs<HTMLUListElement>;
    ol: HTMLAttrs<HTMLOListElement>;
    li: HTMLAttrs<HTMLLIElement>;
    img: HTMLAttrs<HTMLImageElement> & { src?: string; alt?: string };
    svg: SVGAttrs<SVGSVGElement>;
    path: SVGAttrs<SVGPathElement>;
    circle: SVGAttrs<SVGCircleElement>;
    ellipse: SVGAttrs<SVGEllipseElement>;
    rect: SVGAttrs<SVGRectElement>;
    line: SVGAttrs<SVGLineElement>;
    text: SVGAttrs<SVGTextElement>;
    g: SVGAttrs<SVGGElement>;
    defs: SVGAttrs<SVGDefsElement>;
    linearGradient: SVGAttrs<SVGLinearGradientElement>;
    stop: SVGAttrs<SVGStopElement>;
    [elemName: string]: any;
  }
}
