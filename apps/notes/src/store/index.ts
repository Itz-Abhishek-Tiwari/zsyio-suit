import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import "./api/usersApi";
import "./api/notificationsApi";
import "./api/notesApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

// Default singleton instance for non-component contexts (e.g. testing)
export const store = makeStore();

