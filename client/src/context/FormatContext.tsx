import { createContext, useContext, useState, type ReactNode } from 'react';
import { type AdFormat, DEFAULT_FORMAT } from '../types/formats';

interface FormatContextValue {
  format: AdFormat;
  setFormat: (format: AdFormat) => void;
}

const FormatContext = createContext<FormatContextValue | null>(null);

export function FormatProvider({ children }: { children: ReactNode }) {
  const [format, setFormat] = useState<AdFormat>(DEFAULT_FORMAT);

  return (
    <FormatContext.Provider value={{ format, setFormat }}>
      {children}
    </FormatContext.Provider>
  );
}

export function useFormat(): FormatContextValue {
  const ctx = useContext(FormatContext);
  if (!ctx) throw new Error('useFormat must be used within FormatProvider');
  return ctx;
}
