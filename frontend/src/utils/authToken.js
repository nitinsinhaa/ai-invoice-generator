const ACCESS_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';

/** Session-only token storage (clears when the browser tab closes). */
export const getToken = () => sessionStorage.getItem(ACCESS_KEY);

export const getRefreshToken = () => sessionStorage.getItem(REFRESH_KEY);

export const setTokens = ({ accessToken, refreshToken, token }) => {
  const access = accessToken || token;
  if (access) {
    sessionStorage.setItem(ACCESS_KEY, access);
  } else {
    sessionStorage.removeItem(ACCESS_KEY);
  }
  if (refreshToken) {
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  } else {
    sessionStorage.removeItem(REFRESH_KEY);
  }
};

/** @deprecated use setTokens */
export const setToken = (token) => setTokens({ accessToken: token });

export const clearToken = () => {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
};
