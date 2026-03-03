import { createContext, useCallback, useContext, useState } from "react";

interface CollapseContextType {
  collapseAll: () => void;
  subscribe: (callback: () => void) => () => void;
}

const CollapseContext = createContext<CollapseContextType | null>(null);

export const useCollapse = () => {
  const context = useContext(CollapseContext);
  if (!context) {
    throw new Error("useCollapse must be used within a CollapseProvider");
  }
  return context;
};

export function CollapseProvider({ children }: { children: React.ReactNode }) {
  const [listeners, setListeners] = useState<(() => void)[]>([]);

  const subscribe = useCallback((callback: () => void) => {
    setListeners((prev) => [...prev, callback]);
    return () => {
      setListeners((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  const collapseAll = useCallback(() => {
    listeners.forEach((callback) => {
      callback();
    });
  }, [listeners]);

  return (
    <CollapseContext.Provider value={{ collapseAll, subscribe }}>
      {children}
    </CollapseContext.Provider>
  );
}
