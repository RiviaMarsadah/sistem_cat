import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToast(null);
    }, 5000);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    startTimer();
  };

  useEffect(() => {
    if (toast) {
      startTimer();
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [toast, startTimer]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div 
          className={`premium-toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: 'pointer' }}
        >
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
