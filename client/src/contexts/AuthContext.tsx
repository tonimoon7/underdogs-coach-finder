import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 허용된 계정 목록 (실제 운영 시 서버 사이드로 이동)
const ALLOWED_ACCOUNTS: Record<string, string> = {
  "zero@udimpact.ai": "underdogs2024!",
  "admin@underdogs.co.kr": "underdogs2024!",
};

const AUTH_STORAGE_KEY = "underdogs_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? JSON.parse(saved).isAuth === true : false;
  });
  const [user, setUser] = useState<string | null>(() => {
    const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? JSON.parse(saved).user : null;
  });

  useEffect(() => {
    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ isAuth: isAuthenticated, user })
    );
  }, [isAuthenticated, user]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // 간단한 이메일/비밀번호 확인
    const normalizedEmail = email.trim().toLowerCase();
    if (ALLOWED_ACCOUNTS[normalizedEmail] && ALLOWED_ACCOUNTS[normalizedEmail] === password) {
      setIsAuthenticated(true);
      setUser(normalizedEmail);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
