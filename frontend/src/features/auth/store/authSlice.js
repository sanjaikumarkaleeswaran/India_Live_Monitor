import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '../services/authService'

// ── Async Thunks ───────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      return await authService.register(formData)
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed')
    }
  },
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials)
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed')
    }
  },
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout()
    } catch (err) {
      // Allow logout even if server request fails
    }
  },
)

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe()
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user')
    }
  },
)

// ── Cookie helpers (needed for Next.js Edge Middleware) ────
// Middleware runs server-side and cannot access localStorage.
// We mirror the token into a JS-accessible cookie so middleware can read it.
const COOKIE_NAME = 'silm_token'
const COOKIE_MAX_AGE = 15 * 60 // 15 minutes — matches JWT_ACCESS_EXPIRE

const setTokenCookie = (token) => {
  if (typeof document === 'undefined') return
  // SameSite=Strict prevents CSRF; not HttpOnly so JS can read/delete it
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`
}

const clearTokenCookie = () => {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`
}

// ── Initial State ──────────────────────────────────────────
const getLocalStorageToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('silm_token')
  }
  return null
}

const initialState = {
  user: null,
  accessToken: getLocalStorageToken() || null,
  isAuthenticated: !!getLocalStorageToken(),
  isLoading: false,
  error: null,
  isInitialized: false, // Has app attempted to fetch current user?
}

// ── Auth Slice ─────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.error = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('silm_token')
        clearTokenCookie()
        // Also clear admin PIN session on logout
        sessionStorage.removeItem('silm_admin_pin_verified')
      }
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken
      if (typeof window !== 'undefined') {
        localStorage.setItem('silm_token', action.payload.accessToken)
        setTokenCookie(action.payload.accessToken)
      }
    },
    clearError: (state) => {
      state.error = null
    },
    updateUserLocally: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
    setInitialized: (state) => {
      state.isInitialized = true
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.data?.user || null
        state.accessToken = action.payload.data?.accessToken || null
        state.isAuthenticated = true
        if (action.payload.data?.accessToken && typeof window !== 'undefined') {
          localStorage.setItem('silm_token', action.payload.data.accessToken)
          setTokenCookie(action.payload.data.accessToken)
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.data?.user || null
        state.accessToken = action.payload.data?.accessToken || null
        state.isAuthenticated = true
        if (action.payload.data?.accessToken && typeof window !== 'undefined') {
          localStorage.setItem('silm_token', action.payload.data.accessToken)
          setTokenCookie(action.payload.data.accessToken)
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      if (typeof window !== 'undefined') {
        localStorage.removeItem('silm_token')
        clearTokenCookie()
        sessionStorage.removeItem('silm_admin_pin_verified')
      }
    })

    // Fetch current user (on app init)
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.data?.user || null
        state.isAuthenticated = true
        state.isInitialized = true
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.isAuthenticated = false
        state.accessToken = null
        state.isInitialized = true
        if (typeof window !== 'undefined') {
          localStorage.removeItem('silm_token')
          clearTokenCookie()
          sessionStorage.removeItem('silm_admin_pin_verified')
        }
      })
  },
})

export const { logout, setTokens, clearError, updateUserLocally, setInitialized } = authSlice.actions

// Selectors
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthLoading = (state) => state.auth.isLoading
export const selectAuthError = (state) => state.auth.error
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin'
export const selectIsModerator = (state) => ['admin', 'moderator'].includes(state.auth.user?.role)

export default authSlice.reducer
