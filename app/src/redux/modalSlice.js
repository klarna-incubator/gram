import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  type: null,
  props: null,
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    open: (state, action) => {
      state.type = action.payload.type;
      state.props = action.payload.props;
    },
    close: () => initialState,
  },
});

export const modalActions = modalSlice.actions;
export default modalSlice.reducer;
