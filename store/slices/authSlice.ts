import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User as FirebaseUser } from 'firebase/auth';
import { AuthState } from './types';

const initialState: AuthState = {
  user: null,
  idToken: null,
  role: null,
  isAuthenticated: false,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (
      state,
      action: PayloadAction<{ user: FirebaseUser; role: string }>
    ) => {
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      state.loading = false;
    },
    setIdToken: (state, action: PayloadAction<string>) => {
      state.idToken = action.payload;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.idToken = null;
      state.role = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
  },
});

export const { setAuthUser, setIdToken, setAuthLoading, clearAuth } =
  authSlice.actions;

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIdToken = (state: { auth: AuthState }) => state.auth.idToken;
export const selectAuthRole = (state: { auth: AuthState }) => state.auth.role;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.loading;

export default authSlice.reducer;
