'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface ToastEntry {
  id: number;
  message: string;
}

const ToastContext = createContext<((message: string) => void) | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const pushToast = useCallback((message: string) => {
    const id = nextId++;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={pushToast}>
      {children}
      <div className="tf-toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className="tf-toast tf-small">
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const pushToast = useContext(ToastContext);
  if (!pushToast) throw new Error('useToast debe usarse dentro de ToastProvider');
  return pushToast;
}
