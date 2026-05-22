import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { getToken, setTokens, clearToken, getRefreshToken } from '../utils/authToken';
import { applyTheme } from '../utils/theme';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const response = await authApi.getProfile();
    const profile = response.data.data || response.data;
    setUser(profile);
    applyTheme(profile.theme || 'light');
    return profile;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // Migrate legacy localStorage auth to session-only storage
      const legacyToken = localStorage.getItem('token');
      if (legacyToken && !getToken()) {
        setTokens({ accessToken: legacyToken });
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('expenses');

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await refreshProfile();
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshProfile]);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    const payload = response.data.data;
    const { user: loggedInUser, token, accessToken, refreshToken } = payload;

    setTokens({ accessToken: accessToken || token, refreshToken });
    setUser(loggedInUser);
    applyTheme(loggedInUser.theme || 'light');

    return response.data;
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    const payload = response.data.data;
    const { user: newUser, token, accessToken, refreshToken } = payload;

    setTokens({ accessToken: accessToken || token, refreshToken });
    setUser(newUser);
    applyTheme(newUser.theme || 'light');

    return response.data;
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      /* ignore logout API errors */
    }
    clearToken();
    setUser(null);
    applyTheme('light');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    applyTheme(updatedUser.theme || 'light');
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
