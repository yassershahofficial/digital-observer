'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type DragSide = 'left' | 'right' | null;

interface DragContextType {
  dragSide: DragSide;
  setDragSide: (side: DragSide) => void;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export function DragProvider({ children }: { children: ReactNode }) {
  const [dragSide, setDragSide] = useState<DragSide>(null);
  
  return (
    <DragContext.Provider value={{ dragSide, setDragSide }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDrag() {
  const context = useContext(DragContext);
  if (context === undefined) {
    throw new Error('useDrag must be used within a DragProvider');
  }
  return context;
}
