import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import thunk from "redux-thunk";
import { api } from "../api/gram/api";
import model from "../reducers/model";
import { authReducer } from "./authSlice";
import { unauthenticatedErrorHandler } from "./middleware/unauthenticatedMIddleware";
import { realtimeMiddleware } from "./middleware/realtimeTransport";
import modalReducer from "./modalSlice";
import realtimeReducer from "./realtimeSlice";

export const store = configureStore({
  reducer: {
    model,
    modal: modalReducer,
    auth: authReducer,
    realtime: realtimeReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      api.middleware,
      thunk,
      realtimeMiddleware,
      unauthenticatedErrorHandler,
    ]),
});

setupListeners(store.dispatch);
