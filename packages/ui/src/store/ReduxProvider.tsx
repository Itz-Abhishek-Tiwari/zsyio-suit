"use client";

import { useRef } from "react";
import { Provider } from "react-redux";

interface ReduxProviderProps {
  children: React.ReactNode;
  /** Factory function that creates the Redux store — pass each app's own `makeStore`. */
  makeStore: () => unknown;
}

/**
 * Generic Redux provider that lazily initializes any app's store on the
 * client side. Each app passes its own `makeStore` function, so the provider
 * itself has no dependency on any specific store configuration.
 *
 * Usage:
 * ```tsx
 * import { ReduxProvider } from "@zsyio/ui";
 * import { makeStore } from "./store";
 *
 * export function StoreProvider({ children }: { children: React.ReactNode }) {
 *   return <ReduxProvider makeStore={makeStore}>{children}</ReduxProvider>;
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ReduxProvider({ children, makeStore }: ReduxProviderProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storeRef = useRef<any>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
}
