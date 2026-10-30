import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function AlertBanner({ type = "info", title, message, onClose }) {
  const styles = {
    success: {
      bg: "bg-emerald-950/60 border-emerald-500/40 text-emerald-200",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      titleColor: "text-emerald-300"
    },
    error: {
      bg: "bg-rose-950/60 border-rose-500/40 text-rose-200",
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      titleColor: "text-rose-300"
    },
    warning: {
      bg: "bg-amber-950/60 border-amber-500/40 text-amber-200",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      titleColor: "text-amber-300"
    },
    info: {
      bg: "bg-sky-950/60 border-sky-500/40 text-sky-200",
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
      titleColor: "text-sky-300"
    }
  };

  const current = styles[type] || styles.info;

  return (
    <div className={`p-4 rounded-xl border flex items-start justify-between space-x-3 transition-all ${current.bg}`}>
      <div className="flex items-start space-x-3">
        {current.icon}
        <div>
          {title && <h4 className={`text-sm font-bold font-kannada ${current.titleColor}`}>{title}</h4>}
          <p className="text-xs font-kannada mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-white transition-colors shrink-0 p-1"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
