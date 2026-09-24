"use client";

import { ReduxProvider as SharedReduxProvider } from "@zsyio/ui";
import { makeStore } from "./index";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <SharedReduxProvider makeStore={makeStore}>{children}</SharedReduxProvider>;
}
