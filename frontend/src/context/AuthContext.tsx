import { useState, useEffect, useCallback, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { getToken, setToken, removeToken } from "../utils/storage";
import type { User } from "../api/types";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!getToken());

  // Check for existing token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      authApi
        .getMe()
        .then((res) => setUser(res.user))
        .catch(() => removeToken())
        .finally(() => setIsLoading(false));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await authApi.login({ email, password });
    setToken(token);
    const { user } = await authApi.getMe();
    setUser(user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { token } = await authApi.register({ email, password });
    setToken(token);
    const { user } = await authApi.getMe();
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
