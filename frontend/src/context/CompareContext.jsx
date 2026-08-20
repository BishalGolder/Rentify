import { createContext, useContext, useState } from "react";

const CompareContext = createContext(null);
const MAX_COMPARE = 4;

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]); // array of full property objects

  const isComparing = (id) => compareList.some((p) => (p.id || p.property_id) === id);

  const toggleCompare = (property) => {
    const id = property.id || property.property_id;

    setCompareList((prev) => {
      if (prev.some((p) => (p.id || p.property_id) === id)) {
        return prev.filter((p) => (p.id || p.property_id) !== id);
      }
      if (prev.length >= MAX_COMPARE) {
        alert(`You can only compare up to ${MAX_COMPARE} properties at a time.`);
        return prev;
      }
      return [...prev, property];
    });
  };

  const clearCompare = () => setCompareList([]);

  return (
    <CompareContext.Provider value={{ compareList, isComparing, toggleCompare, clearCompare, MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside a CompareProvider");
  return ctx;
}
