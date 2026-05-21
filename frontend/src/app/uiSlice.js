import { createSlice } from '@reduxjs/toolkit'

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('silm_theme') || 'dark'
  }
  return 'dark'
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    theme: getInitialTheme(),
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarMobileOpen: (state, action) => {
      state.sidebarMobileOpen = action.payload
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') {
        localStorage.setItem('silm_theme', state.theme)
      }
    },
    setTheme: (state, action) => {
      state.theme = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem('silm_theme', action.payload)
      }
    },
  },
})

export const { toggleSidebar, setSidebarMobileOpen, toggleTheme, setTheme } = uiSlice.actions
export default uiSlice.reducer
