import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import "./api/salesLeadsApi";
import "./api/salesActivitiesApi";
import "./api/salesPipelineApi";
import "./api/usersApi";

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

export const store = makeStore();
