import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      const data = await authService.login(credentials);
      const token = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      if (token) {
        localStorage.setItem('accessToken', token);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Fetch user profile immediately after login
      const profile = await authService.getCurrentUser();
      return { token, profile };
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed. Please check credentials.');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      const profile = await authService.getCurrentUser();
      return profile;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  return null;
});

const initialState = {
  user: null,
  token: localStorage.getItem('accessToken') || null,
  isAuthenticated: Boolean(localStorage.getItem('accessToken')),
  isLoading: false,
  isInitializing: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.profile;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isInitializing = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isInitializing = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, setCredentials, clearAuth } = authSlice.actions;
export default authSlice.reducer;
