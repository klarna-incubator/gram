import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import thunk from "redux-thunk";
import { api } from "../api/gram/api";
import board from "../reducers/board";
import google from "../reducers/google";
import model from "../reducers/model";
import { webSocketMiddleware } from "./middleware/webSocket";
import modalReducer from "./modalSlice";
import webSocketReducer from "./webSocketSlice";

export const store = configureStore({
  reducer: {
    board,
    google,
    model,
    modal: modalReducer,
    webSocket: webSocketReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([thunk, webSocketMiddleware, api.middleware]),
});

setupListeners(store.dispatch);
