import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    count: 0,
    list: [],
  },
  reducers: {
    setCount: (state, action) => {
      state.count = action.payload;
    },
    increment: (state) => {
      state.count += 1;
    },
    resetCount: (state) => {
      state.count = 0;
    },
    setNotifications: (state, action) => {
      state.list = action.payload;
    },
  },
});

export const { setCount, increment, resetCount, setNotifications } =
  notificationSlice.actions;

export default notificationSlice.reducer;
