import { createContext, useContext, useState } from "react";
import { loginWithMattermost } from "../api/authApi";
import {
  getAccessToken,
  clearAccessToken,
} from "../api/tokenManager";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [auth, setAuth] = useState({
    isAuthenticated: !!getAccessToken(),
    user: null,
  });

  const loginWithPassword = async (loginId, password) => {
    const { accessToken, user } =
      await loginWithMattermost(loginId, password);

    setAuth({
      isAuthenticated: true,
      user,
    });

    return accessToken;
  };

  const logout = () => {
    clearAccessToken();
    setAuth({
      isAuthenticated: false,
      user: null,
    });
  };

  return (
    <AppContext.Provider
      value={{
        state: auth,
        actions: {
          loginWithPassword,
          logout,
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
