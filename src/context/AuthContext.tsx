import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { apiClient, TOKEN_STORAGE_KEY } from "@/lib/api";

const EMAIL_STORAGE_KEY = "ssdr_email";

interface AuthContextValue {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: (options?: { silent?: boolean }) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null
  );
  const [email, setEmail] = useState<string | null>(() =>
    typeof window !== "undefined" ? window.localStorage.getItem(EMAIL_STORAGE_KEY) : null
  );

  const logout = useCallback(
    (options?: { silent?: boolean }) => {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(EMAIL_STORAGE_KEY);
      setToken(null);
      setEmail(null);

      if (!options?.silent) {
        const shouldReplace = location.pathname === "/login";
        navigate("/login", { replace: shouldReplace });
      }
    },
    [location.pathname, navigate]
  );

  const login = useCallback(
    async (userEmail: string, password: string) => {
      const response = await apiClient.login(userEmail, password);
      window.localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
      window.localStorage.setItem(EMAIL_STORAGE_KEY, userEmail);
      setToken(response.access_token);
      setEmail(userEmail);
    },
    []
  );

  useEffect(() => {
    apiClient.setUnauthorizedHandler(() => logout());
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      email,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [email, login, logout, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
