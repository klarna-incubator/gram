import { createSlice } from "@reduxjs/toolkit";

const colors = [
  "#00AA55",
  "#009FD4",
  "#B381B3",
  "#939393",
  "#E3BC00",
  "#D47500",
  "#DC2A2A",
];

const initialState = {
  isConnected: false,
  isEstablishing: false,
  modelId: "",
  error: null,
  activeUsers: [],
};

const webSocketSlice = createSlice({
  name: "webSocket",
  initialState,
  reducers: {
    establishConnection: (state, action) => {
      state.isEstablishing = true;
      state.modelId = action.payload;
    },
    connectionEstablished: (state) => {
      state.isEstablishing = false;
      state.isConnected = true;
    },
    disconnect: (state) => {
      state.isEstablishing = false;
      state.isConnected = false;
    },
    error: (state, action) => {
      state.error = action.payload;
    },
    activeUsers: (state, action) => {
      state.activeUsers = action.payload.users.map((u, i) => ({
        ...u,
        color: colors[i % colors.length],
      }));
    },
  },
});

export const webSocketActions = webSocketSlice.actions;
export default webSocketSlice.reducer;
