import { createContext, useContext } from "react";

interface CollapseContextType {
  collapseAll: () => void;
  subscribe: (callback: () => void) => () => void;
}

export const CollapseContext = createContext<CollapseContextType | null>(null);

export const useCollapse = () => {
  const context = useContext(CollapseContext);
  if (!context) {
    throw new Error("useCollapse must be used within a CollapseProvider");
  }
  return context;
};
