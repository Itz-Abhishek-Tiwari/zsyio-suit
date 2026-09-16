import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface TaskFiltersState {
  clientId?: string;
  productId?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  assignedToIds?: string;
  assignedTeamId?: string;
  type?: string;
  role?: string;
  customRoleId?: string;
  tag?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  [key: string]: string | number | undefined;
}

const initialState: TaskFiltersState = {
  page: 1,
  pageSize: 25,
};

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<Partial<TaskFiltersState>>) {
      const isPagingOnly = Object.keys(action.payload).every((k) => k === "page" || k === "pageSize");
      if (!isPagingOnly && action.payload.page === undefined && state.page !== 1) {
        state.page = 1;
      }
      Object.assign(state, action.payload);
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const { setFilter, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
