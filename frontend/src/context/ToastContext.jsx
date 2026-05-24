import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`premium-toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <div className="premium-toast-icon-wrap">
            {toast.type === 'success' ? <FiCheck /> : <FiX />}
          </div>
          <div className="premium-toast-content">
            <span className="premium-toast-title">
              {toast.type === 'success' ? 'Sukses' : 'Pemberitahuan'}
            </span>
            <span className="premium-toast-message">{toast.message}</span>
          </div>
          <button type="button" className="premium-toast-close" onClick={hideToast}>&times;</button>
        </div>
      )}
    </ToastContext.Provider>
  );
};
