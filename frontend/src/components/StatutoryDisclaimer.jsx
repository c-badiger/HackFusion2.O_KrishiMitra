import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function StatutoryDisclaimer({ className = "" }) {
  return (
    <div className={`p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200/90 text-xs leading-relaxed ${className}`}>
      <div className="flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300 font-kannada">
            ಶಾಸನಬದ್ಧ ಮುನ್ನೆಚ್ಚರಿಕೆ (Statutory Notice):
          </p>
          <p className="font-kannada text-[11px] sm:text-xs">
            ಇದು ಕೃಷಿ ಮಿತ್ರ ವ್ಯವಸ್ಥೆಯ ಸಂಭಾವ್ಯ ಅರ್ಹತಾ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ. ಯಾವುದೇ ಯೋಜನೆಯ ಅಂತಿಮ ಅನುಮೋದನೆ, ಅರ್ಜಿ ಸ್ವೀಕಾರ ಮತ್ತು ಸಬ್ಸಿಡಿ ಮಂಜೂರಾತಿಯು ಕರ್ನಾಟಕ ಸರ್ಕಾರ ಅಥವಾ ಕೇಂದ್ರ ಸರ್ಕಾರದ ಸಂಬಂಧಪಟ್ಟ ಇಲಾಖೆಯ ಅಧಿಕೃತ ಪರಿಶೀಲನೆ, ದಾಖಲೆ ದೃಢೀಕರಣ ಮತ್ತು ಚಾಲ್ತಿಯಲ್ಲಿರುವ ನಿಯಮಾವಳಿಗಳಿಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ.
          </p>
          <p className="text-[10px] sm:text-[11px] text-amber-300/70 italic pt-1 border-t border-amber-900/40">
            Disclaimer: This is an indicative preliminary eligibility assessment. Official approval, document verification, and final financial sanction are strictly subject to rules and scrutiny by the competent government authorities.
          </p>
        </div>
      </div>
    </div>
  );
}
