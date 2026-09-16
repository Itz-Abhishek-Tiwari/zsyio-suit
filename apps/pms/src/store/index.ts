import { configureStore } from "@reduxjs/toolkit";
import filtersReducer from "./slices/filtersSlice";
import boardViewReducer from "./slices/boardViewSlice";
import { baseApi } from "./api/baseApi";
import "./api/clientsApi";
import "./api/productsApi";
import "./api/tasksApi";
import "./api/usersApi";
import "./api/reportsApi";
import "./api/rolesApi";
import "./api/teamsApi";
import "./api/taskTypesApi";
import "./api/taskColumnsApi";
import "./api/dashboardNotesApi";
import "./api/notificationsApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      filters: filtersReducer,
      boardView: boardViewReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

// Default singleton instance for non-component contexts (e.g. testing)
export const store = makeStore();

