import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    theme: localStorage.getItem('silm_theme') || 'dark',
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
      localStorage.setItem('silm_theme', state.theme)
    },
    setTheme: (state, action) => {
      state.theme = action.payload
      localStorage.setItem('silm_theme', action.payload)
    },
  },
})

export const { toggleSidebar, setSidebarMobileOpen, toggleTheme, setTheme } = uiSlice.actions
export default uiSlice.reducer
