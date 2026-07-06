import { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "rayonfl_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => localStorage.getItem(STORAGE_KEY) || null);

  const login = useCallback((prenom) => {
    localStorage.setItem(STORAGE_KEY, prenom);
    setUserState(prenom);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
