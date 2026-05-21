import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectIsAdmin,
  selectIsModerator,
  loginUser,
  registerUser,
  logoutUser,
  clearError,
} from '../store/authSlice'

/**
 * useAuth — Single hook for all authentication operations
 * Use this hook in any component that needs auth state or actions
 */
export const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const user = useSelector(selectUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectAuthLoading)
  const error = useSelector(selectAuthError)
  const isAdmin = useSelector(selectIsAdmin)
  const isModerator = useSelector(selectIsModerator)

  const login = async (credentials) => {
    const result = await dispatch(loginUser(credentials))
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.data?.user?.name?.split(' ')[0] || 'User'}!`)
      navigate('/dashboard')
      return { success: true }
    } else {
      toast.error(result.payload || 'Login failed')
      return { success: false, error: result.payload }
    }
  }

  const register = async (formData) => {
    const result = await dispatch(registerUser(formData))
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created successfully! Welcome to Smart India Monitor.')
      navigate('/dashboard')
      return { success: true }
    } else {
      toast.error(result.payload || 'Registration failed')
      return { success: false, error: result.payload }
    }
  }

  const logout = async () => {
    await dispatch(logoutUser())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const clearAuthError = () => dispatch(clearError())

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isModerator,
    login,
    register,
    logout,
    clearAuthError,
  }
}
