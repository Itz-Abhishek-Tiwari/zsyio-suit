import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type BoardView = "kanban" | "table";

const boardViewSlice = createSlice({
  name: "boardView",
  initialState: "kanban" as BoardView,
  reducers: {
    setBoardView(state, action: PayloadAction<BoardView>) {
      return state === action.payload ? state : action.payload;
    },
  },
});

export const { setBoardView } = boardViewSlice.actions;
export default boardViewSlice.reducer;
