import { createContext, useContext, useState } from "react";

const ToastContext = createContext<any>(null);

export function ToastProvider({ children }: any) {
  const [toast, setToast] = useState<any>(null);

  return (
    <ToastContext.Provider value={{ setToast }}>
      {children}
      {toast && (
        <div
          className={`
            fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}
          `}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/** ✅ SAFE HOOK */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      setToast: () => {}, // no-op fallback
    };
  }
  return ctx;
}