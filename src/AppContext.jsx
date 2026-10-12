import { createContext, useContext } from "react";

export const AppContext = createContext(null);

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useAppContext must be used inside AppContext.Provider");
  }
  return value;
}
