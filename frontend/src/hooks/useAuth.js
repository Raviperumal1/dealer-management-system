import { useSelector, useDispatch } from 'react-redux';
import { loginUser, logoutUser, clearError } from '../features/auth/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading, isInitializing, error } = useSelector(
    (state) => state.auth
  );

  const login = (credentials) => dispatch(loginUser(credentials)).unwrap();
  const logout = () => dispatch(logoutUser());
  const dismissError = () => dispatch(clearError());

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitializing,
    error,
    login,
    logout,
    dismissError,
  };
}

export default useAuth;
