import { createContext, useContext, useState, useCallback } from "react";
import { ADMIN_CODE } from "../constants";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  const unlock = useCallback((code) => {
    if (code === ADMIN_CODE) {
      setIsAdmin(true);
      return true;
    }
    return false;
  }, []);

  const lock = useCallback(() => setIsAdmin(false), []);

  return (
    <AdminContext.Provider value={{ isAdmin, unlock, lock }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin doit être utilisé dans AdminProvider");
  return ctx;
}
