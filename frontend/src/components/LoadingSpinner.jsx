import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = "ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...", subMessage = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-3 text-center">
      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      <p className="text-sm font-medium text-emerald-200 font-kannada">{message}</p>
      {subMessage && <p className="text-xs text-slate-400">{subMessage}</p>}
    </div>
  );
}
