import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import thunk from "redux-thunk";
import { api } from "../api/gram/api";
import board from "../reducers/board";
import model from "../reducers/model";
import { authReducer } from "./authSlice";
import { unauthenticatedErrorHandler } from "./middleware/unauthenticatedMIddleware";
import { webSocketMiddleware } from "./middleware/webSocket";
import modalReducer from "./modalSlice";
import webSocketReducer from "./webSocketSlice";

export const store = configureStore({
  reducer: {
    board,
    model,
    modal: modalReducer,
    auth: authReducer,
    webSocket: webSocketReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      api.middleware,
      thunk,
      webSocketMiddleware,
      unauthenticatedErrorHandler,
    ]),
});

setupListeners(store.dispatch);
