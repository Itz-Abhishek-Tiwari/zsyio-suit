import { describe, it, expect } from "vitest";
import { makeStore } from "@/store";
import { setFilter, resetFilters } from "@/store/slices/filtersSlice";
import { setBoardView } from "@/store/slices/boardViewSlice";

describe("Redux Store SSR Factory (makeStore)", () => {
  it("should create independent store instances per call", () => {
    const store1 = makeStore();
    const store2 = makeStore();

    expect(store1).not.toBe(store2);
    expect(store1.getState().filters.q).toBeUndefined();
    expect(store2.getState().filters.q).toBeUndefined();

    // Mutate store 1
    store1.dispatch(setFilter({ q: "critical bug" }));
    expect(store1.getState().filters.q).toBe("critical bug");

    // Store 2 must remain unaffected
    expect(store2.getState().filters.q).toBeUndefined();
  });

  it("should support board view and filters slice operations", () => {
    const store = makeStore();

    store.dispatch(setBoardView("kanban"));
    expect(store.getState().boardView).toBe("kanban");

    store.dispatch(setBoardView("table"));
    expect(store.getState().boardView).toBe("table");

    store.dispatch(setFilter({ status: "IN_PROGRESS", priority: "HIGH" }));
    expect(store.getState().filters.status).toBe("IN_PROGRESS");
    expect(store.getState().filters.priority).toBe("HIGH");

    store.dispatch(resetFilters());
    expect(store.getState().filters.status).toBeUndefined();
    expect(store.getState().filters.priority).toBeUndefined();
  });
});
