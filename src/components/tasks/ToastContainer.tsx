import React from 'react';
import { useToastStore, Toast as ToastType } from '../../store/toastStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }: { toast: ToastType; onRemove: () => void }) => {
  const icons = {
    SUCCESS: <CheckCircle className="text-white" size={18} />,
    ERROR: <AlertCircle className="text-white" size={18} />,
    WARNING: <AlertTriangle className="text-white" size={18} />,
    INFO: <Info className="text-white" size={18} />,
  };

  const colors = {
    SUCCESS: 'bg-emerald-500',
    ERROR: 'bg-rose-500',
    WARNING: 'bg-orange-500',
    INFO: 'bg-blue-500',
  };

  return (
    <div className="pointer-events-auto flex items-center gap-4 bg-white rounded-[12px] p-4 shadow-lg border border-slate-100 min-w-[320px] max-w-[400px] animate-in slide-in-from-bottom-4 duration-300">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors[toast.type]}`}>
        {icons[toast.type]}
      </div>
      
      <div className="flex-1">
        <h4 className="text-[13px] font-bold text-slate-900 leading-tight">{toast.title}</h4>
        <p className="text-[12px] text-slate-500 mt-0.5">{toast.message}</p>
      </div>

      <button 
        onClick={onRemove}
        className="p-1 hover:bg-slate-100 rounded-lg text-slate-300 hover:text-slate-500 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
